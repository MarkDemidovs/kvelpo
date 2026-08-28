import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { messages, profiles } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { canAccessProjectChat } from "~/server/queries";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response("Project ID required", { status: 400 });
    }

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return new Response("Invalid project ID", { status: 400 });
    }

    if (!(await canAccessProjectChat(projectIdNum, userId))) {
      return new Response("Unauthorized", { status: 403 });
    }

    const messageList = await db
      .select({
        id: messages.id,
        projectId: messages.projectId,
        clerkUserId: messages.clerkUserId,
        message: messages.message,
        createdAt: messages.createdAt,
        senderName: profiles.fullName,
      })
      .from(messages)
      .leftJoin(profiles, eq(messages.clerkUserId, profiles.clerkUserId))
      .where(eq(messages.projectId, projectIdNum))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    return new Response(
      JSON.stringify(
        messageList.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        }))
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await req.json()) as { projectId: number; message: string };
    const { projectId, message: messageText } = body;

    if (!projectId || !messageText?.trim()) {
      return new Response("Project ID and message required", { status: 400 });
    }

    if (!(await canAccessProjectChat(projectId, userId))) {
      return new Response("Unauthorized", { status: 403 });
    }

    await db.insert(messages).values({
      projectId,
      clerkUserId: userId,
      message: messageText.trim(),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
