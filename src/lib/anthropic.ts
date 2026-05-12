import Anthropic from "@anthropic-ai/sdk";
import { Agent } from "https";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não foi definida no ambiente.");
    }
    const agent = new Agent({ rejectUnauthorized: false });
    client = new Anthropic({ apiKey, timeout: 30000, httpAgent: agent });
  }
  return client;
}