import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

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
