import "server-only";
import { currentUser } from "@clerk/nextjs/server";

/**
 * The only accounts that can see the admin Reports page and sidebar entry.
 * Fixed in code on purpose, so no environment setting can widen access.
 */
const ADMIN_EMAILS = ["markussdemidovs@kvelpo.com", "arvismelnis@kvelpo.com"];

/**
 * Only *verified* email addresses on the signed-in Clerk account count, so an
 * unverified address someone adds to their account can't grant access.
 * Returns the admin's Clerk user ID, or null for everyone else.
 */
export async function getAdminUserId(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;

  const isAdmin = user.emailAddresses.some(
    (address) =>
      address.verification?.status === "verified" && ADMIN_EMAILS.includes(address.emailAddress.toLowerCase()),
  );
  return isAdmin ? user.id : null;
}
