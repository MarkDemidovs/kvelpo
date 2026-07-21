"use server";

import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function deleteAccountAction() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  await clerk.users.deleteUser(userId);

  redirect("/");
}
