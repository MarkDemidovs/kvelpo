import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
      <ProfileForm />
    </main>
  );
}
