import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY não foi definida no ambiente.");
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const anthropic = new Anthropic({ 
  apiKey,
  timeout: 30000,
});