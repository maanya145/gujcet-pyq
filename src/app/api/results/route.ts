import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessionResults } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/db-user";
import type { SessionResult } from "@/lib/storage";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getOrCreateUser(clerkId);
  const rows = await db
    .select()
    .from(sessionResults)
    .where(eq(sessionResults.userId, userId))
    .orderBy(desc(sessionResults.date));

  // Re-group into the same shape getAllHistory() returns so the analytics
  // page can use either source without changes to its data processing logic.
  const grouped = new Map<
    string,
    { subject: string; chapter: string; results: SessionResult[] }
  >();

  for (const row of rows) {
    const key = `${row.subject}:${row.chapter}`;
    if (!grouped.has(key)) {
      grouped.set(key, { subject: row.subject, chapter: row.chapter, results: [] });
    }
    grouped.get(key)!.results.push({
      date: row.date.toISOString(),
      correct: row.correct,
      incorrect: row.incorrect,
      ungraded: row.ungraded,
      total: row.total,
      accuracy: row.accuracy,
      timeSpent: row.timeSpent,
    });
  }

  return Response.json({ results: Array.from(grouped.values()) });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, chapter, result } = (await req.json()) as {
    subject: string;
    chapter: string;
    result: SessionResult;
  };

  if (!subject || !chapter || !result) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const userId = await getOrCreateUser(clerkId);
  await db.insert(sessionResults).values({
    userId,
    subject,
    chapter,
    date: new Date(result.date),
    correct: result.correct,
    incorrect: result.incorrect,
    ungraded: result.ungraded,
    total: result.total,
    accuracy: result.accuracy,
    timeSpent: result.timeSpent,
  });

  return Response.json({ ok: true });
}
