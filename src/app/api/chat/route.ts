import { generateText, convertToModelMessages, type UIMessage } from "ai";
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
  const messages = await convertToModelMessages(uiMessages);

  const maxRetries = Math.min(getProviderCount(), 11);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const google = getNextProvider();
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: SYSTEM_PROMPT,
        messages,
      });

      return Response.json({ text });
    } catch (err: unknown) {
      lastError = err;
      const errMsg = String((err as { message?: string })?.message ?? err);
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("rate") || errMsg.includes("500") || errMsg.includes("503")) {
        continue;
      }
      break;
    }
  }

  console.error("All Gemini keys exhausted:", lastError);
  return Response.json(
    { error: "AI service busy. Please try again in a moment." },
    { status: 429 }
  );
}
