import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { userConsent } from "~/server/db/schema";
import { PRIVACY_VERSION, TERMS_VERSION } from "~/lib/legal";
import TermsGateDialog from "./TermsGateDialog";

/**
 * Blocks the app behind a Terms/Privacy acceptance step for signed-in users who
 * haven't accepted the current versions. Acceptance is stored per account, so it
 * is only asked once (and again only when the versions in `~/lib/legal` change).
 */
export default async function TermsGate() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const record = await db
      .select({ termsVersion: userConsent.termsVersion, privacyVersion: userConsent.privacyVersion })
      .from(userConsent)
      .where(eq(userConsent.userId, userId))
      .then((rows) => rows[0]);

    if (record && record.termsVersion >= TERMS_VERSION && record.privacyVersion >= PRIVACY_VERSION) {
      return null;
    }
  } catch (error) {
    // Don't take the whole site down over a transient DB error; the gate shows up on the next load.
    console.error("Failed to check terms acceptance:", error);
    return null;
  }

  return <TermsGateDialog />;
}
