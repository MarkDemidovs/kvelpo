"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { userConsent } from "~/server/db/schema";

export async function saveConsentAction(formData: FormData) {
  const { userId } = await auth();
  const consentAction = String(formData.get("consentAction") ?? "accept");
  const termsVersion = Number(formData.get("termsVersion") ?? 1);
  const privacyVersion = Number(formData.get("privacyVersion") ?? 1);
  const status = consentAction === "reject" ? "rejected" : "accepted";

  if (status === "accepted" && userId) {
    try {
      await db.insert(userConsent).values({
        userId,
        termsVersion,
        privacyVersion,
        acceptedAt: new Date(),
      });
    } catch {
      // Ignore database write failures for now so the consent flow remains usable.
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("app-consent-status", status, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/");
}
