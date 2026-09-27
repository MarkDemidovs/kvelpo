import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { reports, supportMessages } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";

// Lets the client decide whether to show admin navigation. Non-admins (and
// signed-out visitors) just get { isAdmin: false } and nothing else.
export async function GET() {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return Response.json({ isAdmin: false });
  }

  try {
    const [[reportRow], [supportRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open")),
      db.select({ count: sql<number>`count(*)::int` }).from(supportMessages).where(eq(supportMessages.status, "open")),
    ]);
    return Response.json({ isAdmin: true, openReports: reportRow?.count ?? 0, openSupport: supportRow?.count ?? 0 });
  } catch (error) {
    console.error("Error counting open admin items:", error);
    return Response.json({ isAdmin: true, openReports: 0, openSupport: 0 });
  }
}
