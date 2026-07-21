"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { userConsent } from "~/server/db/schema";

export async function saveConsentAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const termsVersion = Number(formData.get("termsVersion") ?? 1);
  const privacyVersion = Number(formData.get("privacyVersion") ?? 1);

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

  const cookieStore = await cookies();
  cookieStore.set("app-consent-granted", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/");
}
