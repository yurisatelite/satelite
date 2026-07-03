import { NextResponse, type NextRequest } from "next/server";
import { getAnthropic } from "@/lib/anthropic";
import { extractAuth } from "@/lib/auth";

const SYSTEM_PROMPT =
  "Você é um pesquisador de mercado de criadores de conteúdo brasileiros. Dado um nicho, sugira criadores de conteúdo relevantes e conhecidos daquele nicho no Brasil (e alguns internacionais de referência quando fizer sentido). Retorne APENAS um JSON válido, sem markdown, com esta estrutura: { creators: [ { name: nome do criador, handle: @ mais provável ou nome do canal, platform: instagram | tiktok | youtube, reason: por que vale estudar esse criador (1 frase em português), content_style: estilo de conteúdo dele em poucas palavras } ] }. Sugira entre 6 e 10 criadores. IMPORTANTE: sugira apenas criadores que você realmente conhece; se não tiver certeza do handle exato, use o nome mais conhecido do canal. Todos os textos em português brasileiro.";

function extractTextFromResponse(
  content: Array<{ type: string; text?: string }>
): string {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("A resposta da IA não retornou JSON válido.");
  }
}

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

    const completion = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Nicho: ${niche}` }],
    });

    const rawText = extractTextFromResponse(
      completion.content as Array<{ type: string; text?: string }>
    );
    const parsed = safeJsonParse(rawText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro na pesquisa de nicho:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
