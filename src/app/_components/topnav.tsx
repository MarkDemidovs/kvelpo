'use client';

import { SignInButton, Show, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import Sidebar from "./Sidebar";

interface ApplicationStatus {
  id: number;
  status: string;
  projectName: string | null;
  roleTitle: string | null;
  message: string | null;
  appliedAt: string;
}

interface NotificationItem {
  id: number;
  projectId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNav() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    if (!isSignedIn) {
      setApplications([]);
      setNotifications([]);
      setIsStatusPanelOpen(false);
      return;
    }

    const controller = new AbortController();

    const fetchStatus = async () => {
      try {
        const [applicationsRes, notificationsRes] = await Promise.all([
          fetch("/api/applications", { signal: controller.signal }),
          fetch("/api/notifications", { signal: controller.signal }),
        ]);

        if (!applicationsRes.ok || !notificationsRes.ok) {
          const errorText = await Promise.all([
            applicationsRes.text().catch(() => ""),
            notificationsRes.text().catch(() => ""),
          ]);
          throw new Error(errorText.filter(Boolean).join(" | "));
        }

        const contentType = applicationsRes.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("Unexpected response format");
        }

        const applicationData = (await applicationsRes.json()) as ApplicationStatus[];
        const notificationData = (await notificationsRes.json()) as NotificationItem[];

        setApplications(applicationData);
        setNotifications(notificationData);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load inbox data:", error);
      }
    };

    void fetchStatus();
    return () => controller.abort();
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
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-6xl text-dark-primary">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-dark-primary hover:text-dark-secondary">

          <Image
            src="/White.svg"
            alt="Kollaborate logo"
            width={90} 
            height={22} 
            className="h-5 w-auto" 
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-full border border-dark-subtle bg-dark-tertiary p-2 text-dark-primary transition hover:border-accent-blue hover:bg-dark-secondary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Show when="signed-in">
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setIsStatusPanelOpen((open) => !open)}
                className="relative rounded-full border border-dark-subtle bg-dark-tertiary p-2 text-dark-primary transition hover:border-accent-blue hover:bg-dark-secondary"
                aria-label="View inbox and request statuses"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" />
                </svg>
                {unreadNotifications.length + applications.length > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-dark-primary">
                    {unreadNotifications.length + applications.length}
                  </span>
                ) : null}
              </button>

              {isStatusPanelOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-3xl border border-dark-subtle bg-dark-card p-3 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-dark-subtle pb-3">
                    <div>
                      <p className="text-sm font-semibold text-dark-primary">Inbox</p>
                      <p className="text-xs text-dark-secondary">Notifications and sent request updates</p>
                    </div>
                    <span className="rounded-full bg-dark-tertiary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-secondary">
                      {unreadNotifications.length + applications.length}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto pb-1">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Project notifications</p>
                      {unreadNotifications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-dark-tertiary p-3 text-sm text-dark-secondary">
                          No new project notifications yet.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {unreadNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={async () => {
                                try {
                                  // Mark notification read on the server
                                  await fetch("/api/notifications", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: notification.id }),
                                  });
                                } catch (err) {
                                  console.error("Failed to mark notification read:", err);
                                }

                                // Optimistically update UI
                                setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));

                                if (notification.projectId) {
                                  setIsStatusPanelOpen(false);
                                  router.push(`/?project=${notification.projectId}`);
                                }
                              }}
                              className="w-full rounded-3xl border border-dark-subtle bg-dark-tertiary p-3 text-left transition hover:border-accent-blue hover:bg-dark-secondary"
                            >
                              <p className="truncate text-sm font-semibold text-dark-primary">{notification.message}</p>
                              <p className="mt-1 text-xs text-dark-secondary">{new Date(notification.createdAt).toLocaleDateString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Sent request statuses</p>
                      {applications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-dark-tertiary p-3 text-sm text-dark-secondary">
                          No sent requests yet. Apply to a role to see status updates here.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {applications.map((application) => (
                            <div key={application.id} className="rounded-3xl border border-dark-subtle bg-dark-tertiary p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-dark-primary">
                                    {application.projectName ?? "Unknown project"}
                                  </p>
                                  <p className="mt-1 text-xs text-dark-secondary">
                                    {application.roleTitle ?? "Requested role"}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${application.status === "pending"
                                      ? "bg-yellow-900/50 text-yellow-400"
                                      : application.status === "accepted"
                                        ? "bg-emerald-900/50 text-emerald-400"
                                        : "bg-dark-tertiary text-dark-secondary"
                                    }`}
                                >
                                  {application.status}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-dark-secondary">
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
            <SignInButton>
              <button className="rounded-full border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-primary transition hover:border-accent-blue hover:bg-dark-secondary">
                Sign In
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton userProfileUrl="/profile" />
          </Show>
        </div>
      </div>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </nav>
  );
}