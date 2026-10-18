"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { userConsent } from "~/server/db/schema";
import { PRIVACY_VERSION, TERMS_VERSION } from "~/lib/legal";

/** Records that the signed-in user accepted the current Terms and Privacy Policy. */
export async function acceptTermsAction(): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const acceptedAt = new Date();
  await db
    .insert(userConsent)
    .values({ userId, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION, acceptedAt })
    .onConflictDoUpdate({
      target: userConsent.userId,
      set: { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION, acceptedAt },
    });
}
