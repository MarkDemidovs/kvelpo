import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, projectRolesNeeded, projects } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applicationStatuses = await db
      .select({
        id: applications.id,
        status: applications.status,
        message: applications.message,
        appliedAt: applications.createdAt,
        projectName: projects.name,
        roleTitle: projectRolesNeeded.title,
      })
      .from(applications)
      .leftJoin(projectRolesNeeded, eq(applications.projectRoleNeededId, projectRolesNeeded.id))
      .leftJoin(projects, eq(projectRolesNeeded.projectId, projects.id))
      .where(eq(applications.clerkUserId, userId))
      .orderBy(desc(applications.createdAt));

    return Response.json(
      applicationStatuses.map((application) => ({
        ...application,
        appliedAt: application.appliedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching application statuses:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
