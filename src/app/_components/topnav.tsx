'use client';

import { SignInButton, Show, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  const handleCreateClick = () => {
    if (window.location.pathname === "/") {
      window.dispatchEvent(new Event("openCreateProjectModal"));
      window.history.pushState({}, "", "/?create=true");
    } else {
      router.push("/?create=true");
    }
  };

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

        if (!applicationsRes.ok) {
          throw new Error(await applicationsRes.text());
        }
        if (!notificationsRes.ok) {
          throw new Error(await notificationsRes.text());
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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 px-4 py-3 shadow-lg shadow-slate-950/20 backdrop-blur-md">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-6xl text-slate-100">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white hover:text-slate-200">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-sm font-black uppercase text-slate-100">
            N
          </span>
          <span>kvelpo</span>
        </Link>

        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </Show>

          <Show when="signed-in">
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setIsStatusPanelOpen((open) => !open)}
                className="relative rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
                aria-label="View inbox and request statuses"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" />
                </svg>
                {notifications.length + applications.length > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                    {notifications.length + applications.length}
                  </span>
                ) : null}
              </button>

              {isStatusPanelOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-700 pb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Inbox</p>
                      <p className="text-xs text-slate-500">Notifications and sent request updates</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      {notifications.length + applications.length}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto pb-1">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Project notifications</p>
                      {notifications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-slate-900 p-3 text-sm text-slate-400">
                          No new project notifications yet.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => {
                                if (notification.projectId) {
                                  setIsStatusPanelOpen(false);
                                  router.push(`/?project=${notification.projectId}`);
                                }
                              }}
                              className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-slate-600 hover:bg-slate-900/90"
                            >
                              <p className="truncate text-sm font-semibold text-slate-100">{notification.message}</p>
                              <p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sent request statuses</p>
                      {applications.length === 0 ? (
                        <div className="mt-3 rounded-3xl bg-slate-900 p-3 text-sm text-slate-400">
                          No sent requests yet. Apply to a role to see status updates here.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {applications.map((application) => (
                            <div key={application.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-100">
                                    {application.projectName ?? "Unknown project"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {application.roleTitle ?? "Requested role"}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    application.status === "pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : application.status === "accepted"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {application.status}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-400">
                                {application.message ?? "No message provided."}
                              </p>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-600">
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
              <button className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800">
                Sign In
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton userProfileUrl="/profile" />
          </Show>
        </div>
      </div>
    </nav>
  );
}