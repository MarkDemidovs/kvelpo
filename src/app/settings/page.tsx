'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { deleteAccountAction } from '~/app/actions/delete-account';
import { useState } from 'react';

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
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-10 text-center">
          <h1 className="text-2xl font-semibold text-dark-primary mb-4">Sign in to access settings</h1>
          <p className="text-dark-secondary">You need to be signed in to view your settings.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-dark-primary">Settings</h1>
        <p className="mt-2 text-dark-secondary">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-6">
          <h2 className="text-xl font-semibold text-dark-primary mb-4">Account Settings</h2>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-primary hover:bg-dark-card transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </Link>
        </div>

        {/* Membership Settings */}
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-6">
          <h2 className="text-xl font-semibold text-dark-primary mb-4">Membership Settings</h2>
          <Link
            href="/profile/subscription"
            className="inline-flex items-center gap-2 rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-primary hover:bg-dark-card transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Subscription
          </Link>
        </div>

        {/* Privacy & Legal */}
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-6">
          <h2 className="text-xl font-semibold text-dark-primary mb-4">Privacy & Legal</h2>
          <div className="space-y-3">
            <Link
              href="/consent"
              className="block rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
            >
              Consent Center
            </Link>
            <Link
              href="/cookies"
              className="block rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
            >
              Cookie Policy
            </Link>
            <Link
              href="/data-retention"
              className="block rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
            >
              Data Retention
            </Link>
            <Link
              href="/terms"
              className="block rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="block rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-900/50 bg-red-900/20 p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-300 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletePending}
            className="rounded-lg border border-red-400 bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:bg-red-900/20"
          >
            {deletePending ? 'Deleting account...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </main>
  );
}