import { createOpenAI } from "@ai-sdk/openai";

const keys = (process.env.OPENAI_API_KEYS || "").split(",").filter(Boolean);

if (keys.length === 0) {
  console.warn("No OPENAI_API_KEYS configured");
}

let currentKeyIndex = 0;

export function getNextProvider() {
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return createOpenAI({ apiKey: key });
}

export function getProviderCount() {
  return keys.length;
}
