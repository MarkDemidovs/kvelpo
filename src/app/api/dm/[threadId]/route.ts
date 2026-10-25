import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { dmMessages, dmThreads } from "~/server/db/schema";
import { getThreadForUser } from "~/server/dm";

const MAX_MESSAGE_LENGTH = 4000;

async function parseThread(params: Promise<{ threadId: string }>, userId: string) {
  const threadId = Number.parseInt((await params).threadId, 10);
  if (Number.isNaN(threadId)) return null;
  return getThreadForUser(threadId, userId);
}

/** Messages in a thread, oldest first. Opening it marks it read for me. */
export async function GET(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const thread = await parseThread(params, userId);
    if (!thread) return Response.json({ error: "Not found" }, { status: 404 });

    const rows = await db.select().from(dmMessages).where(eq(dmMessages.threadId, thread.id)).orderBy(asc(dmMessages.createdAt), asc(dmMessages.id));

    await db
      .update(dmThreads)
      .set(thread.userA === userId ? { userALastReadAt: new Date() } : { userBLastReadAt: new Date() })
      .where(eq(dmThreads.id, thread.id));

    return Response.json(
      rows.map((row) => ({ id: row.id, mine: row.senderClerkUserId === userId, message: row.message, createdAt: row.createdAt })),
    );
  } catch (error) {
    console.error("Failed to load direct messages:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const thread = await parseThread(params, userId);
    if (!thread) return Response.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return Response.json({ error: "Message is empty" }, { status: 400 });
    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(dmMessages).values({ threadId: thread.id, senderClerkUserId: userId, message });
      await tx
        .update(dmThreads)
        .set({ lastMessageAt: now, ...(thread.userA === userId ? { userALastReadAt: now } : { userBLastReadAt: now }) })
        .where(eq(dmThreads.id, thread.id));
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to send direct message:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
