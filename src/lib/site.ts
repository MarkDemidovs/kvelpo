/** Canonical public origin, used for metadata, the sitemap and robots.txt. */
export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://kvelpo.com").replace(/\/+$/, "");

export const siteName = "kvelpo";
export const siteTagline = "Find people to build with";
export const siteDescription =
  "Post a project, list the roles you need, and review who applies. kvelpo helps developers, designers, and founders find teammates for side projects and startups.";
