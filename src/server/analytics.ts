import "server-only";

/** Pages we never count: admin tools, API routes, sign-in screens. */
const SKIPPED_PREFIXES = ["/admin", "/api", "/sign-in", "/sign-up", "/_next"];

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python-requests/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/**
 * Turns a visited path into the label we count under, so every project or profile
 * page counts as one row ("/projects/[id]") and nothing identifying is stored.
 * Returns null for pages we don't count.
 */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.split(/[?#]/)[0]?.trim() ?? "";
  if (!path.startsWith("/") || path.length > 200) return null;
  if (SKIPPED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;

  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (/^\/projects\/[^/]+$/.test(clean)) return "/projects/[id]";
  if (/^\/profile\/(?!subscription$)[^/]+$/.test(clean)) return "/profile/[id]";
  return clean;
}

/** The referring site's host, or "" for direct visits and links from within kvelpo. */
export function referrerHost(raw: unknown, ownHost: string | null): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const host = new URL(raw).host.toLowerCase().replace(/^www\./, "");
    const own = (ownHost ?? "").toLowerCase().replace(/^www\./, "");
    if (!host || host === own) return "";
    return host.slice(0, 128);
  } catch {
    return "";
  }
}
