import { NextResponse, type NextRequest } from "next/server";
import { generateText, safeJsonParse } from "@/lib/anthropic";
import { resolveInputText } from "@/lib/transcript";
import { saveAnalysis } from "@/lib/db";
import { extractAuth } from "@/lib/auth";
import { checkQuota, getProfile, recordUsage, quotaExceededMessage } from "@/lib/usage";

const SYSTEM_PROMPT =
  "Você é um estrategista sênior de conteúdo digital brasileiro. Analise o vídeo fornecido e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicações. IMPORTANTE: todos os valores do JSON devem ser escritos em português brasileiro. O JSON deve ter exatamente esta estrutura: { summary: resumo do vídeo em 2-3 frases, analysis: { hook_type: tipo do gancho, structure: estrutura narrativa, why_it_worked: por que funcionou, strongest_point: ponto mais forte, weakest_point: ponto mais fraco, storytelling_format: formato de storytelling usado (ex: jornada pessoal, lista, contraste antes/depois, confissão) e como ele sustenta a retenção, visual_layout: sugestão de layout visual para regravar (enquadramento, cortes, texto na tela, b-roll) }, script: { hook: gancho adaptado ao nicho e estilo do usuário, development: desenvolvimento, closing: fechamento, filming_tips: { light: dica de luz, framing: enquadramento, presence: presença } } }";

type AnalyzeBody = {
  input?: string;
  niche?: string;
  style?: string;
  platform?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const input = body.input?.trim();
    let niche = body.niche?.trim();
    let style = body.style?.trim();
    const platform = body.platform?.trim() || "Não especificada";

    const auth = extractAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Faça login para analisar vídeos." },
        { status: 401 }
      );
    }

    // Nicho/estilo permanentes das configurações entram como fallback
    if (!niche || !style) {
      const profile = await getProfile(auth.userId, auth.accessToken);
      niche = niche || profile.niche?.trim() || "";
      style = style || profile.style?.trim() || "";
    }

    if (!input || !niche || !style) {
      return NextResponse.json(
        { error: "Campos obrigatórios: input, niche e style." },
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

    const sourceText = await resolveInputText(input);

    const rawText = await generateText({
      system: SYSTEM_PROMPT,
      maxTokens: 2000,
      prompt:
        `Nicho: ${niche}\n` +
        `Estilo: ${style}\n` +
        `Conteúdo do vídeo/transcrição:\n${sourceText}`,
    });

    const parsed = safeJsonParse(rawText);

    await recordUsage(auth.userId, auth.accessToken, "analyze");

    try {
      await saveAnalysis(
        { user_id: auth.userId, platform, input, niche, style, result: parsed },
        auth.accessToken
      );
    } catch (saveError) {
      console.error("Erro ao salvar análise:", saveError);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("ERRO COMPLETO:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
