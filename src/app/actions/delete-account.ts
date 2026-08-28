"use server";

import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eraseUserAccountData } from "~/server/queries";

export async function deleteAccountAction() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Cancel billing and scrub app data first, while we still hold the userId.
  await eraseUserAccountData(userId);

  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  await clerk.users.deleteUser(userId);

  redirect("/");
}
