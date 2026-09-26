"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

interface SignInRequiredProps {
  title: string;
  message: string;
}

// Shown in place of a members-only page. Pops the Clerk sign-in modal once
// Clerk has loaded, and keeps a button so the modal can be reopened if closed.
export default function SignInRequired({ title, message }: SignInRequiredProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const hasPrompted = useRef(false);

  useEffect(() => {
    if (!isLoaded || isSignedIn || hasPrompted.current) return;
    hasPrompted.current = true;
    openSignIn({ forceRedirectUrl: window.location.href });
  }, [isLoaded, isSignedIn, openSignIn]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
      <div className="card-raised p-10 text-center">
        <h1 className="text-2xl font-semibold text-dark-primary mb-4">{title}</h1>
        <p className="text-dark-secondary">{message}</p>
        <button
          type="button"
          onClick={() => openSignIn({ forceRedirectUrl: window.location.href })}
          className="btn-primary mt-6"
        >
          Sign in
        </button>
      </div>
    </main>
  );
}
