import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getAnthropic } from "@/lib/anthropic";

const SYSTEM_PROMPT =
  "Você é um estrategista sênior de conteúdo digital. Analise o vídeo fornecido e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicações. O JSON deve ter exatamente esta estrutura: { analysis: { hook_type, structure, why_it_worked, strongest_point, weakest_point }, script: { hook, development, closing, filming_tips: { light, framing, presence } } }";

type AnalyzeBody = {
  input?: string;
  niche?: string;
  style?: string;
};

function extractTextFromResponse(
  content: Array<{ type: string; text?: string }>
): string {
  const text = content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text;
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

async function resolveInputText(input: string): Promise<string> {
  if (!input.startsWith("http")) {
    return input;
  }

  const transcript = await YoutubeTranscript.fetchTranscript(input);
  const combinedText = transcript.map((line) => line.text).join(" ").trim();

  if (!combinedText) {
    throw new Error("Não foi possível extrair transcrição da URL.");
  }

  return combinedText;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const input = body.input?.trim();
    const niche = body.niche?.trim();
    const style = body.style?.trim();

    if (!input || !niche || !style) {
      return NextResponse.json(
        { error: "Campos obrigatórios: input, niche e style." },
        { status: 400 }
      );
    }

    const sourceText = await resolveInputText(input);

    const completion = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            `Nicho: ${niche}\n` +
            `Estilo: ${style}\n` +
            `Conteúdo do vídeo/transcrição:\n${sourceText}`,
        },
      ],
    });

    const rawText = extractTextFromResponse(
      completion.content as Array<{ type: string; text?: string }>
    );
    const parsed = safeJsonParse(rawText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("ERRO COMPLETO:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
