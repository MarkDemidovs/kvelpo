import "server-only";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Admins are listed by email in the ADMIN_EMAILS env var (comma-separated).
 * Only *verified* email addresses on the signed-in Clerk account count, so an
 * unverified address someone adds to their account can't grant access.
 * Returns the admin's Clerk user ID, or null for everyone else.
 */
export async function getAdminUserId(): Promise<string | null> {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return null;

  const user = await currentUser();
  if (!user) return null;

  const isAdmin = user.emailAddresses.some(
    (address) =>
      address.verification?.status === "verified" && allowed.includes(address.emailAddress.toLowerCase()),
  );
  return isAdmin ? user.id : null;
}
