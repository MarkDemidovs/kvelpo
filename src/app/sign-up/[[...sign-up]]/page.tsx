import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-5 px-4 py-12">
      <SignUp />
      <p className="max-w-sm text-center text-xs leading-relaxed text-dark-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-accent-blue hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>. You&apos;ll be asked to confirm this once after signing up.
      </p>
    </div>
  );
}
