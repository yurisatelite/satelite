import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não foi definida no ambiente.");
    }
    client = new Anthropic({ apiKey, maxRetries: 3 });
  }
  return client;
}

// Usa streaming acumulado em vez de request única: conexões longas com a API
// derrubavam com "Premature close" no Railway; o stream mantém a conexão viva.
export async function generateText(opts: {
  system: string;
  prompt: string;
  maxTokens: number;
}): Promise<string> {
  const stream = getAnthropic().messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  const message = await stream.finalMessage();

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

export function safeJsonParse(raw: string): unknown {
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
