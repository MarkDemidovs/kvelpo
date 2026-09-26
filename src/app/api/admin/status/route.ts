import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { reports } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";

// Lets the client decide whether to show admin navigation. Non-admins (and
// signed-out visitors) just get { isAdmin: false } and nothing else.
export async function GET() {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return Response.json({ isAdmin: false });
  }

  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "open"));
    return Response.json({ isAdmin: true, openReports: row?.count ?? 0 });
  } catch (error) {
    console.error("Error counting open reports:", error);
    return Response.json({ isAdmin: true, openReports: 0 });
  }
}
