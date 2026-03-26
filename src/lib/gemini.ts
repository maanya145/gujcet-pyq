import { createGoogleGenerativeAI } from "@ai-sdk/google";

const keys = (process.env.GEMINI_API_KEYS || "").split(",").filter(Boolean);

if (keys.length === 0) {
  console.warn("No GEMINI_API_KEYS configured");
}

let currentKeyIndex = 0;

export function getNextProvider() {
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return createGoogleGenerativeAI({ apiKey: key });
}

export function getProviderCount() {
  return keys.length;
}
