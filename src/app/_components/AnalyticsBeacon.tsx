"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Sends one anonymous "page viewed" ping per page the visitor opens. No cookies or
 * browser storage are used; the server keeps only a daily count per page (see
 * src/server/analytics.ts).
 */
export default function AnalyticsBeacon() {
  const pathname = usePathname();
  const firstPage = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    // Only the first page of a visit has an outside referrer; later ones are in-app navigation.
    const referrer = firstPage.current ? document.referrer : "";
    firstPage.current = false;

    const payload = JSON.stringify({ path: pathname, referrer });
    try {
      if (!navigator.sendBeacon("/api/analytics/hit", new Blob([payload], { type: "application/json" }))) {
        void fetch("/api/analytics/hit", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      // Analytics must never get in the way of the page.
    }
  }, [pathname]);

  return null;
}
