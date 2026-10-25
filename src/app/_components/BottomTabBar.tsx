"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useInbox } from "./InboxContext";

const iconProps = {
  className: "h-6 w-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ExploreIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
  </svg>
);

const ProjectsIcon = () => (
  <svg {...iconProps}>
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const MessagesIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const InboxIcon = () => (
  <svg {...iconProps}>
    <path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" />
    <path d="M3 13h5l1 2h6l1-2h5" />
  </svg>
);

interface Tab {
  href: string;
  label: string;
  icon: ReactNode;
  /** Pathname prefixes that count as "on this tab". */
  match: (pathname: string) => boolean;
  badge?: boolean;
}

/**
 * Phone-only navigation for signed-in users (hidden from md up, where the top
 * bar and the menu drawer take over). Renders a spacer so page content and the
 * footer never sit underneath the fixed bar.
 */
export default function BottomTabBar() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const { unreadCount } = useInbox();

  if (!isLoaded || !isSignedIn) return null;

  const tabs: Tab[] = [
    { href: "/", label: "Explore", icon: <ExploreIcon />, match: (p) => p === "/" },
    { href: "/projects", label: "Projects", icon: <ProjectsIcon />, match: (p) => p === "/projects" || p.startsWith("/projects/") },
  ];
  const rightTabs: Tab[] = [
    { href: "/chats", label: "Messages", icon: <MessagesIcon />, match: (p) => p === "/chats" },
    { href: "/inbox", label: "Inbox", icon: <InboxIcon />, match: (p) => p === "/inbox", badge: unreadCount > 0 },
  ];

  const renderTab = (tab: Tab) => {
    const active = tab.match(pathname);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={`relative flex flex-1 flex-col items-center gap-1 pt-2 text-[11px] font-medium transition-colors ${
          active ? "text-fg" : "text-dark-muted hover:text-fg"
        }`}
      >
        <span className="relative">
          {tab.icon}
          {tab.badge ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-dark-primary bg-red-500" aria-label="Unread" />
          ) : null}
        </span>
        {tab.label}
      </Link>
    );
  };

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-dark-subtle bg-dark-primary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-md items-start px-2">
          {tabs.map(renderTab)}

          <div className="flex flex-1 flex-col items-center">
            <Link
              href="/?create=true"
              aria-label="Post a project"
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-lg ring-4 ring-[var(--bg)] transition active:scale-95"
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
            <span className="pt-0.5 text-[11px] font-medium text-dark-muted">Post</span>
          </div>

          {rightTabs.map(renderTab)}
        </div>
      </nav>
    </>
  );
}
