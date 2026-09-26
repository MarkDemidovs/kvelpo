import type { MetadataRoute } from "next";
import { siteUrl } from "~/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in-only or transactional pages: nothing useful to index.
      disallow: ["/api/", "/admin", "/sign-in", "/sign-up", "/inbox", "/chats", "/settings", "/profile$", "/profile/subscription"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
