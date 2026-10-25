"use client";

import { SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import SignInRequired from "~/app/_components/SignInRequired";
import ThemeToggle from "~/app/_components/ThemeToggle";

interface ProfileSummary {
  fullName: string | null;
  membership: string | null;
}

interface AdminStatus {
  isAdmin: boolean;
  openReports?: number;
  openSupport?: number;
}

const iconProps = {
  className: "h-[18px] w-[18px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Chevron = () => (
  <svg className="h-4 w-4 shrink-0 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="9 6 15 12 9 18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-tertiary text-fg">{children}</span>
  );
}

function Row({
  href,
  icon,
  label,
  trailing,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-dark-subtle px-4 py-3.5 text-fg transition last:border-b-0 hover:bg-dark-tertiary"
    >
      <IconBubble>{icon}</IconBubble>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {trailing}
      <Chevron />
    </Link>
  );
}

const planLabel = (membership: string | null | undefined) => (membership === "pro" ? "Pro plan" : "Free plan");

export default function AccountPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [admin, setAdmin] = useState<AdminStatus | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();

    fetch("/api/profile", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<ProfileSummary>) : null))
      .then((data) => setProfile(data))
      .catch(() => undefined);

    fetch("/api/admin/status", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<AdminStatus>) : null))
      .then((data) => setAdmin(data?.isAdmin ? data : null))
      .catch(() => undefined);

    return () => controller.abort();
  }, [isSignedIn]);

  if (isLoaded && !isSignedIn) {
    return <SignInRequired title="Sign in to see your account" message="You need to be signed in to view your account." />;
  }

  const profileName = profile?.fullName?.trim();
  const name = profileName?.length ? profileName : (user?.fullName ?? "Your account");
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-xl px-4 py-6 md:py-10">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-fg md:text-3xl">Account</h1>

      <div className="space-y-5">
        <Link
          href={userId ? `/profile/${userId}` : "/profile"}
          className="card-raised flex items-center gap-4 p-4"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-blue/15 text-sm font-bold text-accent-blue">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-fg">{name}</span>
            <span className="block text-sm text-accent-blue">View your profile</span>
          </span>
          <Chevron />
        </Link>

        <div className="card-raised overflow-hidden !transform-none">
          <Row
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
                {planLabel(profile?.membership)}
              </span>
            }
          />
          <Row
            href="/settings"
            label="Settings"
            icon={
              <svg {...iconProps}>
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
            }
          />
          <div className="flex items-center gap-3 border-b border-dark-subtle px-4 py-3">
            <IconBubble>
              <svg {...iconProps}>
                <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
              </svg>
            </IconBubble>
            <span className="flex-1 text-[15px] font-semibold text-fg">Appearance</span>
            <ThemeToggle hideSystem />
          </div>
          <Row
            href="/support"
            label="Help & support"
            icon={
              <svg {...iconProps}>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01" />
              </svg>
            }
          />
        </div>

        {admin ? (
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-dark-muted">Admin</p>
            <div className="card-raised overflow-hidden !transform-none">
              <Row
                href="/admin"
                label="Admin panel"
                icon={
                  <svg {...iconProps}>
                    <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" />
                  </svg>
                }
              />
              <Row
                href="/admin/reports"
                label="Reports"
                trailing={
                  admin.openReports ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">{admin.openReports}</span>
                  ) : null
                }
                icon={
                  <svg {...iconProps}>
                    <path d="M6 21V4m0 0h11l-2 4 2 4H6" />
                  </svg>
                }
              />
              <Row
                href="/admin/support"
                label="Support inbox"
                trailing={
                  admin.openSupport ? (
                    <span className="rounded-full bg-accent-blue px-2 py-0.5 text-xs font-semibold text-accent-fg">{admin.openSupport}</span>
                  ) : null
                }
                icon={
                  <svg {...iconProps}>
                    <path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" />
                    <path d="M3 13h5l1 2h6l1-2h5" />
                  </svg>
                }
              />
            </div>
          </div>
        ) : null}

        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dark-subtle py-3.5 text-[15px] font-semibold text-danger transition hover:bg-danger-bg"
          >
            <svg {...iconProps}>
              <path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 8l4 4-4 4M20 12H9" />
            </svg>
            Log out
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
