"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Saves the visitor's cookie choice. This is cookie consent only; accepting the
 * Terms and Privacy Policy is a separate, per-account step (see `acceptTermsAction`).
 */
export async function saveConsentAction(formData: FormData) {
  const consentActionRaw = formData.get("consentAction");
  const consentAction = typeof consentActionRaw === "string" ? consentActionRaw : "accept";
  const status = consentAction === "reject" ? "rejected" : "accepted";

  const cookieStore = await cookies();
  cookieStore.set("app-consent-status", status, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect(await returnPath());
}

// Send the visitor back to the page they chose from (the banner can appear on
// any page). Only same-origin paths are used, and the consent page itself
// falls back to the home page.
async function returnPath(): Promise<string> {
  const referer = (await headers()).get("referer");
  const host = (await headers()).get("host");
  if (!referer || !host) return "/";
  try {
    const url = new URL(referer);
    if (url.host !== host || url.pathname === "/consent") return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
