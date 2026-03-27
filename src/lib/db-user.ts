import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Returns the internal DB user id for a Clerk userId, creating the user
 * record on first call. Safe against concurrent inserts.
 */
export async function getOrCreateUser(clerkId: string): Promise<number> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  try {
    const inserted = await db
      .insert(users)
      .values({ clerkId })
      .returning({ id: users.id });
    return inserted[0].id;
  } catch {
    // Race condition: another concurrent request inserted first
    const refetch = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    return refetch[0].id;
  }
}
