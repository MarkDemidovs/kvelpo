import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dmThreads } from "~/server/db/schema";

/** A thread's two people are stored in id order (userA < userB), so a pair maps to exactly one thread. */
export function orderPair(first: string, second: string): [string, string] {
  return first < second ? [first, second] : [second, first];
}

/** The thread, but only if `userId` is one of its two people. */
export async function getThreadForUser(threadId: number, userId: string) {
  const thread = await db.select().from(dmThreads).where(eq(dmThreads.id, threadId)).then((rows) => rows[0]);
  if (!thread || (thread.userA !== userId && thread.userB !== userId)) return null;
  return thread;
}

export async function getOrCreateThread(me: string, other: string) {
  const [userA, userB] = orderPair(me, other);
  const existing = await db
    .select()
    .from(dmThreads)
    .where(and(eq(dmThreads.userA, userA), eq(dmThreads.userB, userB)))
    .then((rows) => rows[0]);
  if (existing) return existing;

  await db.insert(dmThreads).values({ userA, userB }).onConflictDoNothing();
  const created = await db
    .select()
    .from(dmThreads)
    .where(and(eq(dmThreads.userA, userA), eq(dmThreads.userB, userB)))
    .then((rows) => rows[0]);
  return created!;
}
