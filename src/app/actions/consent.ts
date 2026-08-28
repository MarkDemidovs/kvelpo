"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { userConsent } from "~/server/db/schema";

export async function saveConsentAction(formData: FormData) {
  const { userId } = await auth();
  const consentActionRaw = formData.get("consentAction");
  const consentAction = typeof consentActionRaw === "string" ? consentActionRaw : "accept";
  const termsVersion = Number(formData.get("termsVersion") ?? 1);
  const privacyVersion = Number(formData.get("privacyVersion") ?? 1);
  const status = consentAction === "reject" ? "rejected" : "accepted";

  if (status === "accepted" && userId) {
    try {
      await db
        .insert(userConsent)
        .values({
          userId,
          termsVersion,
          privacyVersion,
          acceptedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userConsent.userId,
          set: { termsVersion, privacyVersion, acceptedAt: new Date() },
        });
    } catch (error) {
      console.error("Failed to record consent:", error);
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
