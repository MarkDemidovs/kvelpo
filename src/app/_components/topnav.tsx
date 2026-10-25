'use client';

import { SignInButton, Show, UserButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useInbox } from "./InboxContext";
import Logo from "./Logo";
import Sidebar from "./Sidebar";

export default function TopNav() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { applications, notifications, unreadCount, markRead } = useInbox();
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    if (!isSignedIn) setIsStatusPanelOpen(false);
  }, [isSignedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-dark-subtle bg-dark-primary/90 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-6xl text-fg">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-fg hover:text-fg-secondary">
          <Logo className="h-4 w-auto" />
          <span className="text-[17px] font-semibold tracking-tight text-fg">kvelpo</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="hidden rounded-full border border-dark-subtle bg-dark-tertiary p-2 text-fg transition hover:border-accent-blue hover:bg-dark-secondary md:block"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Show when="signed-in">
            <div className="relative hidden md:block" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setIsStatusPanelOpen((open) => !open)}
                className="relative rounded-full border border-dark-subtle bg-dark-tertiary p-2 text-fg transition hover:border-accent-blue hover:bg-dark-secondary"
                aria-label="View inbox and request statuses"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {isStatusPanelOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-3xl border border-dark-subtle bg-dark-card p-3 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-dark-subtle pb-3">
                    <div>
                      <p className="text-sm font-semibold text-fg">Inbox</p>
                      <p className="text-xs text-fg-secondary">Notifications and sent request updates</p>
                    </div>
                    <span className="rounded-full bg-dark-tertiary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-secondary">
                      {unreadCount}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto pb-1">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Project notifications</p>
                      {unreadNotifications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-dark-tertiary p-3 text-sm text-fg-secondary">
                          No new project notifications yet.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {unreadNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => {
                                void markRead(notification.id);

                                if (notification.projectId) {
                                  setIsStatusPanelOpen(false);
                                  router.push(`/projects/${notification.projectId}`);
                                }
                              }}
                              className="w-full rounded-3xl border border-dark-subtle bg-dark-tertiary p-3 text-left transition hover:border-accent-blue hover:bg-dark-secondary"
                            >
                              <p className="truncate text-sm font-semibold text-fg">{notification.message}</p>
                              <p className="mt-1 text-xs text-fg-secondary">{new Date(notification.createdAt).toLocaleDateString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Sent request statuses</p>
                      {applications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-dark-tertiary p-3 text-sm text-fg-secondary">
                          No sent requests yet. Apply to a role to see status updates here.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {applications.map((application) => (
                            <div key={application.id} className="rounded-3xl border border-dark-subtle bg-dark-tertiary p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-fg">
                                    {application.projectName ?? "Unknown project"}
                                  </p>
                                  <p className="mt-1 text-xs text-fg-secondary">
                                    {application.roleTitle ?? "Requested role"}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${application.status === "pending"
                                      ? "bg-warning-bg text-warning"
                                      : application.status === "accepted"
                                        ? "bg-success-bg text-success"
                                        : "bg-dark-tertiary text-fg-secondary"
                                    }`}
                                >
                                  {application.status}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-fg-secondary">
                                {application.message ?? "No message provided."}
                              </p>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-dark-muted">
                                Applied {new Date(application.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-fg transition hover:border-accent-blue hover:bg-dark-secondary">
                Sign In
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div className="hidden md:block">
              <UserButton userProfileUrl="/profile" />
            </div>
            {/* Phones: the avatar opens the Account page (tab bar covers the rest) */}
            <Link
              href="/account"
              aria-label="Account"
              className="block h-9 w-9 overflow-hidden rounded-full border border-dark-subtle bg-dark-tertiary md:hidden"
            >
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </Link>
          </Show>
        </div>
      </div>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </nav>
  );
}