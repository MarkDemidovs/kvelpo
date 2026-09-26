'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { deleteAccountAction } from '~/app/actions/delete-account';
import { useState } from 'react';
import SignInRequired from "~/app/_components/SignInRequired";

const rowLinkClass =
  "flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-dark-primary transition hover:bg-dark-tertiary";

const ChevronIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="9 6 15 12 9 18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SettingsPage() {
  const { isSignedIn } = useAuth();
  const [deletePending, setDeletePending] = useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will delete your account and associated project data. Continue?')) {
      return;
    }

    setDeletePending(true);
    try {
      await deleteAccountAction();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeletePending(false);
    }
  };

  if (!isSignedIn) {
    return <SignInRequired title="Sign in to access settings" message="You need to be signed in to view your settings." />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Settings</h1>
        <p className="mt-2 text-dark-secondary">Manage your account, membership, and legal preferences.</p>
      </div>

      <div className="space-y-4">
        <div className="card-raised p-2">
          <Link href="/profile" className={rowLinkClass}>
            <div>
              <p className="text-[15px] font-semibold">Account</p>
              <p className="mt-0.5 text-[13px] text-dark-muted">Name, bio, links, photo, skills</p>
            </div>
            <ChevronIcon />
          </Link>
          <Link href="/profile/subscription" className={rowLinkClass}>
            <div>
              <p className="text-[15px] font-semibold">Membership</p>
              <p className="mt-0.5 text-[13px] text-dark-muted">Manage your plan and billing</p>
            </div>
            <ChevronIcon />
          </Link>
        </div>

        <div className="card-raised p-2">
          <Link href="/consent" className={rowLinkClass}>
            <p className="text-[15px] font-semibold">Consent center</p>
            <ChevronIcon />
          </Link>
          <Link href="/cookies" className={rowLinkClass}>
            <p className="text-[15px] font-semibold">Cookie policy</p>
            <ChevronIcon />
          </Link>
          <Link href="/data-retention" className={rowLinkClass}>
            <p className="text-[15px] font-semibold">Data retention</p>
            <ChevronIcon />
          </Link>
          <Link href="/terms" className={rowLinkClass}>
            <p className="text-[15px] font-semibold">Terms of service</p>
            <ChevronIcon />
          </Link>
          <Link href="/privacy" className={rowLinkClass}>
            <p className="text-[15px] font-semibold">Privacy policy</p>
            <ChevronIcon />
          </Link>
        </div>

        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
          <p className="text-[15px] font-semibold text-red-400">Danger zone</p>
          <p className="mt-2 text-sm text-dark-secondary">
            Once you delete your account, there is no going back.
          </p>
          <button
            type="button"
            onClick={() => void handleDeleteAccount()}
            disabled={deletePending}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-red-900/50 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletePending ? 'Deleting account...' : 'Delete account'}
          </button>
        </div>
      </div>
    </main>
  );
}
