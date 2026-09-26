import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { reports } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    // Same response as a missing route, so the admin API isn't advertised.
    return new Response("Not found", { status: 404 });
  }

  const id = parseInt((await params).id, 10);
  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status === "resolved" || body?.status === "open" ? body.status : null;
  if (isNaN(id) || !status) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(reports)
      .set(
        status === "resolved"
          ? { status, resolvedAt: new Date(), resolvedBy: adminId }
          : { status, resolvedAt: null, resolvedBy: null },
      )
      .where(eq(reports.id, id))
      .returning({ id: reports.id, status: reports.status });

    if (!updated) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
