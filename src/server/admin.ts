import "server-only";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

/**
 * Anyone with a *verified* address on this domain is an admin. Fixed in code
 * on purpose, so no environment setting can widen access, and only the team
 * can create addresses on the domain (via the Zoho account).
 */
const ADMIN_EMAIL_DOMAIN = "@kvelpo.com";

type ClerkEmail = { emailAddress: string; verification: { status: string } | null };

function hasAdminEmail(emailAddresses: ClerkEmail[]): boolean {
  // An unverified address someone adds to their account never counts.
  return emailAddresses.some(
    (address) =>
      address.verification?.status === "verified" && address.emailAddress.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN),
  );
}

/** The signed-in admin's Clerk user ID, or null for everyone else. */
export async function getAdminUserId(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  return hasAdminEmail(user.emailAddresses) ? user.id : null;
}

/** Whether some other user is an admin (e.g. to stop admins banning each other). */
export async function isAdminUser(clerkUserId: string): Promise<boolean> {
  try {
    const user = await (await clerkClient()).users.getUser(clerkUserId);
    return hasAdminEmail(user.emailAddresses);
  } catch {
    return false;
  }
}
