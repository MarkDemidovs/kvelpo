import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { pageviewDaily } from "~/server/db/schema";
import { isBot, normalizePath, referrerHost } from "~/server/analytics";

/**
 * Counts one page view, anonymously: only the day, a normalised path and the referring
 * site's host are stored. Nothing about the person (no IP, user id, cookie or user agent)
 * is kept, and visitors who send Do Not Track or Global Privacy Control are not counted.
 */
export async function POST(request: Request) {
  const noContent = new Response(null, { status: 204 });

  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return noContent;
  if (isBot(request.headers.get("user-agent"))) return noContent;

  const body = (await request.json().catch(() => null)) as { path?: unknown; referrer?: unknown } | null;
  const path = normalizePath(body?.path);
  if (!path) return noContent;

  try {
    await db
      .insert(pageviewDaily)
      .values({ day: sql`current_date`, path, referrer: referrerHost(body?.referrer, request.headers.get("host")), views: 1 })
      .onConflictDoUpdate({
        target: [pageviewDaily.day, pageviewDaily.path, pageviewDaily.referrer],
        set: { views: sql`${pageviewDaily.views} + 1` },
      });
  } catch (error) {
    console.error("Failed to count page view:", error);
  }
  return noContent;
}
