import { NextResponse, type NextRequest } from "next/server";
import { generateText, safeJsonParse } from "@/lib/anthropic";
import { extractAuth } from "@/lib/auth";

const SYSTEM_PROMPT =
  "Você é um pesquisador de mercado de criadores de conteúdo brasileiros. Dado um nicho, sugira criadores de conteúdo relevantes e conhecidos daquele nicho no Brasil (e alguns internacionais de referência quando fizer sentido). Retorne APENAS um JSON válido, sem markdown, com esta estrutura: { creators: [ { name: nome do criador, handle: @ mais provável ou nome do canal, platform: instagram | tiktok | youtube, reason: por que vale estudar esse criador (1 frase em português), content_style: estilo de conteúdo dele em poucas palavras } ] }. Sugira entre 6 e 10 criadores. IMPORTANTE: sugira apenas criadores que você realmente conhece; se não tiver certeza do handle exato, use o nome mais conhecido do canal. Todos os textos em português brasileiro.";

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Faça login para pesquisar nichos." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { niche?: string };
    const niche = body.niche?.trim();
    if (!niche) {
      return NextResponse.json(
        { error: "Informe um nicho para pesquisar." },
        { status: 400 }
      );
    }

    const rawText = await generateText({
      system: SYSTEM_PROMPT,
      maxTokens: 1500,
      prompt: `Nicho: ${niche}`,
    });

    const parsed = safeJsonParse(rawText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro na pesquisa de nicho:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
