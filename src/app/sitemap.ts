import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { projects } from "~/server/db/schema";
import { siteUrl } from "~/lib/site";

// Rebuilt at most hourly so newly posted projects get picked up.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/projects`, changeFrequency: "daily", priority: 0.9 },
    ...["/privacy", "/terms", "/cookies", "/data-retention", "/consent"].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  try {
    const publicProjects = await db
      .select({ id: projects.id, createdAt: projects.createdAt, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.isPublic, true))
      .orderBy(desc(projects.createdAt))
      .limit(5000);

    return [
      ...staticPages,
      ...publicProjects.map((project) => ({
        url: `${siteUrl}/projects/${project.id}`,
        lastModified: project.updatedAt ?? project.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    // A DB hiccup shouldn't take the whole sitemap down.
    console.error("Failed to load projects for sitemap:", error);
    return staticPages;
  }
}
