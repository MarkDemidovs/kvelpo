"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { acceptTermsAction } from "~/app/actions/terms";
import { LEGAL_PATHS } from "~/lib/legal";

export default function TermsGateDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Let people read the documents they're being asked to accept.
  if (LEGAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      try {
        await acceptTermsAction();
        router.refresh();
      } catch {
        setError("Something went wrong saving your acceptance. Please try again.");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-scrim p-4 backdrop-blur-sm"
    >
      <div className="card-raised w-full max-w-md p-7">
        <p className="label-eyebrow">One last step</p>
        <h2 id="terms-gate-title" className="mt-3 text-2xl font-bold tracking-tight text-fg">
          Accept our terms to continue
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fg-secondary">
          To use kvelpo you need to accept our Terms of Service and Privacy Policy. You only have to do this once.
        </p>

        <label className="mt-5 flex items-start gap-3 text-sm text-fg-secondary">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent-blue"
          />
          <span>
            I have read and agree to the{" "}
            <Link href="/terms" target="_blank" className="text-accent-blue hover:underline">
              Terms of Service
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" target="_blank" className="text-accent-blue hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error ? <p className="mt-4 rounded-md bg-danger-bg p-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!agreed || pending}
            className="btn-primary !px-6 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving..." : "Accept and continue"}
          </button>
          <SignOutButton redirectUrl="/">
            <button type="button" className="btn-secondary !px-5 text-sm">
              Decline and sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
