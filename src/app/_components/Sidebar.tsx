"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
    active ? "bg-dark-tertiary text-dark-primary" : "text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary"
  }`;

const navIconClass = (active: boolean) => `h-5 w-5 ${active ? "text-accent-blue" : ""}`;

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // Members-only pages in this menu open the sign-in modal for signed-out
  // visitors, landing them on the page they picked once signed in.
  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onClose();
    if (isLoaded && !isSignedIn) {
      event.preventDefault();
      openSignIn({ forceRedirectUrl: href });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Admin-only "Reports" entry. Checked each time the menu opens so the open
  // count stays current; the server decides who is an admin (see src/server/admin.ts).
  const [admin, setAdmin] = useState<{ openReports: number; openSupport: number } | null>(null);
  useEffect(() => {
    if (!isSignedIn) {
      setAdmin(null);
      return;
    }
    if (!isOpen) return;

    const controller = new AbortController();
    fetch("/api/admin/status", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ isAdmin: boolean; openReports?: number; openSupport?: number }>) : null))
      .then((data) => setAdmin(data?.isAdmin ? { openReports: data.openReports ?? 0, openSupport: data.openSupport ?? 0 } : null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [isSignedIn, isOpen]);

  if (!mounted) return null;

  const content = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 transform bg-dark-card shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-subtle">
            <h2 className="text-xl font-semibold text-dark-primary">Manage</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <Link
                href="/profile"
                className={navLinkClass(pathname === "/profile")}
                onClick={(e) => handleNavigate(e, "/profile")}
              >
                <svg
                  className={navIconClass(pathname === "/profile")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </Link>

              <Link
                href="/inbox"
                className={navLinkClass(pathname === "/inbox")}
                onClick={(e) => handleNavigate(e, "/inbox")}
              >
                <svg
                  className={navIconClass(pathname === "/inbox")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8z"
                  />
                </svg>
                Inbox
              </Link>

              <Link
                href="/chats"
                className={navLinkClass(pathname === "/chats")}
                onClick={(e) => handleNavigate(e, "/chats")}
              >
                <svg
                  className={navIconClass(pathname === "/chats")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Chats
              </Link>

              <Link
                href="/projects"
                className={navLinkClass(pathname === "/projects")}
                onClick={onClose}
              >
                <svg
                  className={navIconClass(pathname === "/projects")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Projects
              </Link>

              <Link
                href="/profile/subscription"
                className={navLinkClass(pathname === "/profile/subscription")}
                onClick={(e) => handleNavigate(e, "/profile/subscription")}
              >
                <svg
                  className={navIconClass(pathname === "/profile/subscription")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Membership Settings
              </Link>

              <Link
                href="/settings"
                className={navLinkClass(pathname === "/settings")}
                onClick={(e) => handleNavigate(e, "/settings")}
              >
                <svg
                  className={navIconClass(pathname === "/settings")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>

              {/* Open to everyone, signed in or not: people who can't sign in need it most. */}
              <Link
                href="/support"
                className={navLinkClass(pathname === "/support")}
                onClick={onClose}
              >
                <svg
                  className={navIconClass(pathname === "/support")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Contact support
              </Link>

              {admin ? (
                <>
                  <p className="px-4 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-muted">Admin</p>
                  <Link
                    href="/admin/reports"
                    className={navLinkClass(pathname === "/admin/reports")}
                    onClick={onClose}
                  >
                    <svg
                      className={navIconClass(pathname === "/admin/reports")}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 21V4m0 0h11l-1.5 4L15 12H4"
                      />
                    </svg>
                    Reports
                    {admin.openReports > 0 ? (
                      <span className="ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {admin.openReports}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    href="/admin/support"
                    className={navLinkClass(pathname === "/admin/support")}
                    onClick={onClose}
                  >
                    <svg
                      className={navIconClass(pathname === "/admin/support")}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    Support inbox
                    {admin.openSupport > 0 ? (
                      <span className="ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-accent-blue px-2 py-0.5 text-xs font-semibold text-white">
                        {admin.openSupport}
                      </span>
                    ) : null}
                  </Link>
                </>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
