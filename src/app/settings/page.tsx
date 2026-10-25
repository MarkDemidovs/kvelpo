'use client';

import { useAuth } from '@clerk/nextjs';
import { deleteAccountAction } from '~/app/actions/delete-account';
import { useEffect, useState } from 'react';
import { MenuControlRow, MenuGroup, MenuRow, menuIconProps as iconProps } from "~/app/_components/MenuList";
import SignInRequired from "~/app/_components/SignInRequired";
import ThemeToggle from "~/app/_components/ThemeToggle";

const planLabel = (membership: string | null | undefined) => (membership === 'pro' ? 'Pro plan' : 'Free plan');

export default function SettingsPage() {
  const { isSignedIn } = useAuth();
  const [deletePending, setDeletePending] = useState(false);
  const [membership, setMembership] = useState<string | null>(null);
  const [browsePrivately, setBrowsePrivately] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    fetch('/api/profile', { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ membership?: string | null; browsePrivately?: boolean }>) : null))
      .then((data) => {
        setMembership(data?.membership ?? null);
        setBrowsePrivately(Boolean(data?.browsePrivately));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [isSignedIn]);

  const togglePrivateBrowsing = async () => {
    const next = !browsePrivately;
    setBrowsePrivately(next);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browsePrivately: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch (err) {
      console.error('Failed to update private browsing:', err);
      setBrowsePrivately(!next);
    }
  };

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
    <main className="mx-auto max-w-xl px-4 py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg md:text-3xl">Settings</h1>

      <div className="space-y-6">
        <MenuGroup title="Account">
          <MenuRow
            href="/profile"
            label="Profile"
            description="Name, bio, photo, skills and links"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.2-3.6 4.2-5.5 8-5.5s6.8 1.9 8 5.5" />
              </svg>
            }
          />
          <MenuRow
            href="/profile/subscription"
            label="Membership"
            icon={
              <svg {...iconProps}>
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
              </svg>
            }
            trailing={
              <span className="rounded-full bg-dark-tertiary px-3 py-1 text-xs font-medium text-fg-secondary">
                {planLabel(membership)}
              </span>
            }
          />
          <MenuControlRow
            label="Appearance"
            icon={
              <svg {...iconProps}>
                <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
              </svg>
            }
          >
            <ThemeToggle />
          </MenuControlRow>
        </MenuGroup>

        <MenuGroup title="Privacy and legal">
          <MenuControlRow
            label="Browse privately"
            description="Project owners on Pro won't see your name when you view their project, only your top skill."
            icon={
              <svg {...iconProps}>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          >
            <button
              type="button"
              role="switch"
              aria-checked={browsePrivately}
              aria-label="Browse privately"
              onClick={() => void togglePrivateBrowsing()}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${browsePrivately ? 'bg-accent-blue' : 'bg-dark-tertiary'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${browsePrivately ? 'translate-x-5' : ''}`} />
            </button>
          </MenuControlRow>
          <MenuRow
            href="/consent"
            label="Consent center"
            icon={
              <svg {...iconProps}>
                <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" />
              </svg>
            }
          />
          <MenuRow
            href="/cookies"
            label="Cookie policy"
            icon={
              <svg {...iconProps}>
                <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
                <path d="M14 3v5h5" />
              </svg>
            }
          />
          <MenuRow
            href="/data-retention"
            label="Data retention"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />
          <MenuRow
            href="/terms"
            label="Terms of service"
            icon={
              <svg {...iconProps}>
                <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
                <path d="M14 3v5h5M9 13h6M9 17h6" />
              </svg>
            }
          />
          <MenuRow
            href="/privacy"
            label="Privacy policy"
            icon={
              <svg {...iconProps}>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 118 0v3" />
              </svg>
            }
          />
        </MenuGroup>

        <MenuGroup title="Help">
          <MenuRow
            href="/support"
            label="Contact support"
            description="We usually reply within a day"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01" />
              </svg>
            }
          />
        </MenuGroup>

        <div className="rounded-2xl border border-danger/40 bg-danger-bg p-5">
          <p className="text-[15px] font-semibold text-danger">Delete account</p>
          <p className="mt-2 text-sm text-fg-secondary">
            Permanently removes your profile, projects and messages. This can&apos;t be undone.
          </p>
          <button
            type="button"
            onClick={() => void handleDeleteAccount()}
            disabled={deletePending}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-danger/40 px-5 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletePending ? 'Deleting account...' : 'Delete account'}
          </button>
        </div>
      </div>
    </main>
  );
}
