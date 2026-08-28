import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await db
      .select({
        id: notifications.id,
        projectId: notifications.projectId,
        type: notifications.type,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.clerkUserId, userId))
      .orderBy(desc(notifications.createdAt));

    return new Response(JSON.stringify(data.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }))), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await req.json()) as { id?: number };
    const id = Number(body?.id);
    if (!id || isNaN(id)) {
      return new Response("Invalid notification id", { status: 400 });
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.clerkUserId, userId)))
      .returning({ id: notifications.id });

    if (!updated) {
      return new Response("Notification not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
