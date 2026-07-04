import { NextResponse, type NextRequest } from "next/server";
import { generateText, safeJsonParse } from "@/lib/anthropic";
import { resolveInputText } from "@/lib/transcript";
import { extractAuth } from "@/lib/auth";
import {
  checkQuota,
  getProfile,
  getServerSupabase,
  recordUsage,
  quotaExceededMessage,
} from "@/lib/usage";

const SYSTEM_PROMPT =
  "Você é um roteirista sênior de vídeos curtos para criadores brasileiros. Receba um vídeo de referência (transcrição), o nicho e o estilo de comunicação do usuário. Desmonte o que funciona no vídeo original e RECONSTRUA o roteiro adaptado à voz do usuário — não copie frases, recrie a estrutura com o conteúdo do nicho dele. Retorne APENAS um JSON válido, sem markdown, com esta estrutura: { script: { hook: gancho de abertura (3 primeiros segundos), development: desenvolvimento completo do roteiro palavra por palavra, closing: fechamento que amarra a ideia, cta: chamada para ação final adaptada à plataforma }, notes: { adapted_from: o que foi aproveitado da referência (1 frase), voice_notes: como o roteiro reflete o estilo do usuário (1 frase), duration_estimate: duração estimada de gravação falada } }. Todos os textos em português brasileiro, prontos para serem lidos em voz alta.";

type ScriptBody = {
  reference?: string;
  niche?: string;
  style?: string;
  platform?: string;
  hook?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Faça login para gerar roteiros." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ScriptBody;
    const reference = body.reference?.trim();
    let niche = body.niche?.trim();
    let style = body.style?.trim();
    const platform = body.platform?.trim() || "instagram";

    if (!reference) {
      return NextResponse.json(
        { error: "Cole a URL ou transcrição do vídeo de referência." },
        { status: 400 }
      );
    }

    if (!niche || !style) {
      const profile = await getProfile(auth.userId, auth.accessToken);
      niche = niche || profile.niche?.trim() || "";
      style = style || profile.style?.trim() || "";
    }

    if (!niche || !style) {
      return NextResponse.json(
        {
          error:
            "Informe nicho e estilo (ou defina-os permanentemente em Configurações).",
        },
        { status: 400 }
      );
    }

    const quota = await checkQuota(auth.userId, auth.accessToken);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quotaExceededMessage(quota), quota },
        { status: 429 }
      );
    }

    const sourceText = await resolveInputText(reference);
    const chosenHook = body.hook?.trim();

    const rawText = await generateText({
      system: SYSTEM_PROMPT,
      maxTokens: 2500,
      prompt:
        `Nicho do usuário: ${niche}\n` +
        `Estilo de comunicação do usuário: ${style}\n` +
        `Plataforma de destino: ${platform}\n` +
        (chosenHook
          ? `Gancho escolhido pelo usuário (o roteiro DEVE abrir com ele, palavra por palavra): ${chosenHook}\n`
          : "") +
        `Vídeo de referência (transcrição):\n${sourceText}`,
    });

    const parsed = safeJsonParse(rawText);

    await recordUsage(auth.userId, auth.accessToken, "script");

    try {
      const supabase = getServerSupabase(auth.accessToken);
      await supabase.from("scripts").insert({
        user_id: auth.userId,
        reference: reference.slice(0, 5000),
        niche,
        style,
        platform,
        result: parsed,
      });
    } catch (saveError) {
      console.error("Erro ao salvar roteiro:", saveError);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro ao gerar roteiro:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
