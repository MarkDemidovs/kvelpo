"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { MAX_REPORT_DETAILS, REPORT_REASONS, type ReportReason, type ReportTargetType } from "~/lib/reports";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string | number;
  /** Shown in the dialog title, e.g. the project or person's name. */
  targetLabel: string;
}

export default function ReportButton({ targetType, targetId, targetLabel }: ReportButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const open = () => {
    if (isLoaded && !isSignedIn) {
      openSignIn({ forceRedirectUrl: window.location.href });
      return;
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setReason("");
    setDetails("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) {
      setError("Please pick a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't send the report. Please try again.");
      }
      setSubmitted(true);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const noun = targetType === "project" ? "project" : "profile";

  return (
    <>
      {submitted ? (
        <span className="text-xs text-dark-muted">Thanks, we&apos;ll review this {noun}.</span>
      ) : (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-muted transition hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0h11l-1.5 4L15 12H4" />
          </svg>
          Report {noun}
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={close}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card-raised w-full max-w-md space-y-4 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
          >
            <div>
              <h2 id="report-dialog-title" className="text-lg font-semibold text-dark-primary">
                Report {noun}
              </h2>
              <p className="mt-1 truncate text-sm text-dark-secondary">{targetLabel}</p>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-dark-secondary">What&apos;s wrong?</legend>
              {(Object.entries(REPORT_REASONS) as [ReportReason, string][]).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                    reason === value ? "border-accent-blue text-dark-primary" : "border-dark-subtle text-dark-secondary hover:bg-dark-tertiary"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-[oklch(68%_0.18_240)]"
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-dark-secondary">Anything else we should know? (optional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={MAX_REPORT_DETAILS}
                className="mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-tertiary px-3.5 py-2.5 text-sm text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={close} className="btn-secondary !px-4 !py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Sending..." : "Send report"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
