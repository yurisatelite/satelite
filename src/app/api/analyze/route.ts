import { NextResponse, type NextRequest } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { getAnthropic } from "@/lib/anthropic";
import { saveAnalysis, countMonthlyAnalyses } from "@/lib/db";

const SYSTEM_PROMPT =
  "Você é um estrategista sênior de conteúdo digital brasileiro. Analise o vídeo fornecido e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicações. IMPORTANTE: todos os valores do JSON devem ser escritos em português brasileiro. O JSON deve ter exatamente esta estrutura: { analysis: { hook_type: tipo do gancho em português, structure: estrutura narrativa em português, why_it_worked: por que funcionou em português, strongest_point: ponto mais forte em português, weakest_point: ponto mais fraco em português }, script: { hook: gancho adaptado ao nicho e estilo do usuário em português, development: desenvolvimento em português, closing: fechamento em português, filming_tips: { light: dica de luz em português, framing: enquadramento em português, presence: presença em português } } }";

type AnalyzeBody = {
  input?: string;
  niche?: string;
  style?: string;
  platform?: string;
};

type AuthInfo = { accessToken: string; userId: string };

function extractAuth(request: NextRequest): AuthInfo | null {
  const raw = request.cookies.get("sb-auth-token")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(decodeURIComponent(raw));
    const accessToken = session?.access_token;
    if (!accessToken) return null;
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64").toString("utf8")
    );
    return { accessToken, userId: payload.sub };
  } catch {
    return null;
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const input = body.input?.trim();
    const niche = body.niche?.trim();
    const style = body.style?.trim();
    const platform = body.platform?.trim() || "Não especificada";

    if (!input || !niche || !style) {
      return NextResponse.json(
        { error: "Campos obrigatórios: input, niche e style." },
        { status: 400 }
      );
    }

    const auth = extractAuth(request);

    if (auth) {
      const count = await countMonthlyAnalyses(auth.userId, auth.accessToken);
      if (count >= 3) {
        return NextResponse.json(
          { error: "Você atingiu o limite de 3 análises gratuitas este mês." },
          { status: 429 }
        );
      }
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

    if (auth) {
      try {
        await saveAnalysis(
          { user_id: auth.userId, platform, input, niche, style, result: parsed },
          auth.accessToken
        );
      } catch (saveError) {
        console.error("Erro ao salvar análise:", saveError);
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("ERRO COMPLETO:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
