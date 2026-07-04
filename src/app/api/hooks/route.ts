import { NextResponse, type NextRequest } from "next/server";
import { generateText, safeJsonParse } from "@/lib/anthropic";
import { extractAuth } from "@/lib/auth";
import { checkQuota, getProfile, recordUsage, quotaExceededMessage } from "@/lib/usage";

const SYSTEM_PROMPT =
  "Você é um especialista em ganchos de vídeos curtos para redes sociais brasileiras. A partir do conteúdo fornecido, gere EXATAMENTE 10 variações de gancho (primeira frase falada do vídeo, que prende a atenção nos 3 primeiros segundos). Retorne APENAS um JSON válido, sem markdown, com esta estrutura: { hooks: [ { text: o gancho em português brasileiro, type: um destes tipos exatos: contradição | dado chocante | pergunta | confissão, rationale: por que esse gancho funciona (1 frase curta) } ] }. Distribua os 10 ganchos entre os 4 tipos (2 a 3 de cada). Adapte tudo ao nicho e estilo do usuário. Todos os textos em português brasileiro.";

type HooksBody = {
  content?: string;
  niche?: string;
  style?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Faça login para gerar ganchos." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as HooksBody;
    const content = body.content?.trim();
    let niche = body.niche?.trim();
    let style = body.style?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Cole o conteúdo ou tema do vídeo para gerar ganchos." },
        { status: 400 }
      );
    }

    if (!niche || !style) {
      const profile = await getProfile(auth.userId, auth.accessToken);
      niche = niche || profile.niche?.trim() || "geral";
      style = style || profile.style?.trim() || "direto";
    }

    const quota = await checkQuota(auth.userId, auth.accessToken);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quotaExceededMessage(quota), quota },
        { status: 429 }
      );
    }

    const rawText = await generateText({
      system: SYSTEM_PROMPT,
      maxTokens: 1800,
      prompt:
        `Nicho: ${niche}\n` +
        `Estilo: ${style}\n` +
        `Conteúdo/tema do vídeo:\n${content}`,
    });

    const parsed = safeJsonParse(rawText);

    await recordUsage(auth.userId, auth.accessToken, "hooks");

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro ao gerar ganchos:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
