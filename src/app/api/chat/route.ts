import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getNextProvider, getProviderCount } from "@/lib/gemini";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a helpful science and math tutor for 12th standard students.

Rules:
- Explain concepts clearly and concisely
- Use simple language, avoid jargon unless defining it
- Use LaTeX for math: inline $...$ and display $$...$$
- When explaining a question, focus on the underlying concept, why the correct answer is right, and why the student's choice was wrong
- Keep responses under 200 words unless asked for more detail
- Be encouraging`;

export async function POST(req: Request) {
  const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();

  // Convert UIMessage[] (with parts) to ModelMessage[] (with content) for streamText
  const messages = await convertToModelMessages(uiMessages);

  const maxRetries = Math.min(getProviderCount(), 5);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const google = getNextProvider();
      const result = streamText({
        model: google("gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        messages,
      });
      return result.toUIMessageStreamResponse();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      // Only retry on rate limit (429) or server error (5xx)
      if (status === 429 || (status && status >= 500)) {
        continue;
      }
      // For other errors, don't retry
      break;
    }
  }

  console.error("All Gemini keys exhausted or error:", lastError);
  return new Response(
    JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
