import { streamText } from "ai";
import { getNextProvider, getProviderCount } from "@/lib/gemini";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a GUJCET exam tutor helping Indian students prepare for the Gujarat Common Entrance Test.

Rules:
- Give concise, exam-focused explanations
- Use simple language appropriate for 12th standard students
- When explaining concepts, relate them to the GUJCET syllabus
- Use LaTeX notation for math: wrap inline math in $...$ and display math in $$...$$
- If the student asks about a specific question, explain the underlying concept, why the correct answer is right, and why wrong options are wrong
- Keep responses under 200 words unless the student asks for more detail
- Be encouraging and supportive`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const maxRetries = Math.min(getProviderCount(), 5);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const google = getNextProvider();
      const result = streamText({
        model: google("gemini-2.0-flash"),
        system: SYSTEM_PROMPT,
        messages,
      });
      return result.toTextStreamResponse();
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
