import { YoutubeTranscript } from "youtube-transcript";

// Extrai a transcrição de uma URL do YouTube, ou devolve o texto como veio.
// O YouTube bloqueia IPs de datacenter com captcha de tempos em tempos —
// nesse caso devolvemos uma instrução clara em vez do erro cru da lib.
export async function resolveInputText(input: string): Promise<string> {
  if (!input.startsWith("http")) {
    return input;
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(input);
    const combinedText = transcript.map((line) => line.text).join(" ").trim();
    if (!combinedText) {
      throw new Error("vazio");
    }
    return combinedText;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("captcha") || msg.includes("too many requests")) {
      throw new Error(
        "O YouTube bloqueou temporariamente a extração automática de transcrição. " +
          "Abra o vídeo, copie a transcrição (⋯ > Mostrar transcrição) e cole aqui no lugar da URL."
      );
    }
    if (msg.includes("disabled") || msg.includes("not available") || msg.includes("vazio")) {
      throw new Error(
        "Este vídeo não tem transcrição disponível. Cole a transcrição manualmente no lugar da URL."
      );
    }
    throw new Error(
      "Não foi possível extrair a transcrição da URL. Cole a transcrição manualmente no lugar da URL."
    );
  }
}
