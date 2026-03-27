import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/db-user";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getOrCreateUser(clerkId);
  const rows = await db
    .select({ bookmarkKey: bookmarks.bookmarkKey })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));

  return Response.json({ bookmarks: rows.map((r) => r.bookmarkKey) });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await req.json();
  if (!key || typeof key !== "string") {
    return Response.json({ error: "Missing key" }, { status: 400 });
  }

  const userId = await getOrCreateUser(clerkId);
  await db
    .insert(bookmarks)
    .values({ userId, bookmarkKey: key })
    .onConflictDoNothing();

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = await getOrCreateUser(clerkId);

  if (body.all === true) {
    await db.delete(bookmarks).where(eq(bookmarks.userId, userId));
  } else {
    const { key } = body;
    if (!key || typeof key !== "string") {
      return Response.json({ error: "Missing key" }, { status: 400 });
    }
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.bookmarkKey, key)));
  }

  return Response.json({ ok: true });
}
