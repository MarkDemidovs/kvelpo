'use client';

import { SignInButton, Show, useAuth, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useInbox } from "./InboxContext";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const iconProps = {
  className: "h-[18px] w-[18px] shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const tabClass = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-dark-tertiary text-fg" : "text-fg-secondary hover:text-fg"
  }`;

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = (parts.length > 1 ? `${parts[0]![0]}${parts[parts.length - 1]![0]}` : (parts[0] ?? "?").slice(0, 2)).toUpperCase();
  return <span className="text-[11px] font-semibold text-accent-blue">{text}</span>;
}

function Avatar({ imageUrl, name, className = "h-8 w-8" }: { imageUrl?: string | null; name: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-blue/12 ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Initials name={name} />
      )}
    </span>
  );
}

function MenuLink({ href, icon, children, onClick, trailing }: { href: string; icon: ReactNode; children: ReactNode; onClick: () => void; trailing?: ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg transition-colors hover:bg-dark-tertiary">
      <span className="text-fg-secondary">{icon}</span>
      {children}
      {trailing}
    </Link>
  );
}

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut, openSignIn } = useClerk();
  const { unreadCount } = useInbox();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [admin, setAdmin] = useState<{ openReports: number; openSupport: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.fullName?.trim() ?? user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "Your account";

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Admin-only entries. Checked when the menu opens so the open counts stay
  // current; the server decides who is an admin (see src/server/admin.ts).
  useEffect(() => {
    if (!isSignedIn) {
      setAdmin(null);
      return;
    }
    if (!menuOpen) return;
    const controller = new AbortController();
    fetch("/api/admin/status", { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ isAdmin: boolean; openReports?: number; openSupport?: number }>) : null))
      .then((data) => setAdmin(data?.isAdmin ? { openReports: data.openReports ?? 0, openSupport: data.openSupport ?? 0 } : null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [isSignedIn, menuOpen]);

  const requireSignIn = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isLoaded && !isSignedIn) {
      event.preventDefault();
      openSignIn({ forceRedirectUrl: href });
    }
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-dark-subtle bg-dark-primary/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 text-fg sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="kvelpo home">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]">
            <Logo className="h-3.5 w-auto" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">kvelpo</span>
        </Link>

        <div className="ml-4 hidden items-center gap-1 md:flex">
          <Link href="/" className={tabClass(pathname === "/")}>Explore</Link>
          <Link href="/projects" onClick={(event) => requireSignIn(event, "/projects")} className={tabClass(pathname === "/projects")}>
            My projects
          </Link>
          <Link href="/chats" onClick={(event) => requireSignIn(event, "/chats")} className={tabClass(pathname === "/chats")}>
            Messages
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <form onSubmit={submitSearch} role="search" className="relative hidden w-56 lg:block xl:w-64">
            <svg {...iconProps} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full rounded-full bg-dark-tertiary py-2 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-dark-muted focus:ring-1 focus:ring-accent-blue"
            />
          </form>

          <Show when="signed-in">
            <Link href="/?create=true" className="btn-primary hidden !px-4 !py-2 text-sm md:inline-flex">
              New project
            </Link>

            <Link
              href="/inbox"
              aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : "Inbox"}
              className="relative hidden rounded-full p-2 text-fg transition hover:bg-dark-tertiary md:block"
            >
              <svg {...iconProps} className="h-5 w-5">
                <path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" />
                <path d="M3 13h5l1 2h6l1-2h5" />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>

            {/* Phones: the avatar opens the Account page (the tab bar covers the rest) */}
            <Link href="/account" aria-label="Account" className="md:hidden">
              <Avatar imageUrl={user?.imageUrl} name={displayName} className="h-9 w-9" />
            </Link>

            <div className="relative hidden md:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-full p-0.5 transition hover:bg-dark-tertiary"
              >
                <Avatar imageUrl={user?.imageUrl} name={displayName} />
                <svg {...iconProps} className="mr-1 h-3.5 w-3.5 text-fg-secondary">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {menuOpen ? (
                <div role="menu" className="absolute right-0 mt-2 w-72 rounded-2xl border border-dark-subtle bg-dark-primary p-2 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <Avatar imageUrl={user?.imageUrl} name={displayName} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
                      <Link href="/profile" onClick={closeMenu} className="text-[13px] text-accent-blue hover:underline">
                        View your profile
                      </Link>
                    </div>
                  </div>

                  <div className="my-1 h-px bg-dark-subtle" />
                  <MenuLink
                    href="/profile/subscription"
                    onClick={closeMenu}
                    icon={<svg {...iconProps}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>}
                  >
                    Membership
                  </MenuLink>
                  <MenuLink
                    href="/settings"
                    onClick={closeMenu}
                    icon={<svg {...iconProps}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>}
                  >
                    Settings
                  </MenuLink>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm text-fg">
                    <span className="text-fg-secondary">
                      <svg {...iconProps}><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" /></svg>
                    </span>
                    <span className="flex-1">Appearance</span>
                    <ThemeToggle hideSystem />
                  </div>

                  <div className="my-1 h-px bg-dark-subtle" />
                  <MenuLink
                    href="/support"
                    onClick={closeMenu}
                    icon={<svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01" /></svg>}
                  >
                    Help &amp; support
                  </MenuLink>

                  {admin ? (
                    <>
                      <div className="my-1 h-px bg-dark-subtle" />
                      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-dark-muted">Admin</p>
                      <MenuLink href="/admin" onClick={closeMenu} icon={<svg {...iconProps}><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" /></svg>}>
                        Admin panel
                      </MenuLink>
                      <MenuLink
                        href="/admin/reports"
                        onClick={closeMenu}
                        icon={<svg {...iconProps}><path d="M5 21V4m0 0h11l-1.5 4L16 12H5" /></svg>}
                        trailing={admin.openReports > 0 ? <span className="ml-auto rounded-full bg-red-500 px-2 text-xs font-semibold text-white">{admin.openReports}</span> : null}
                      >
                        Reports
                      </MenuLink>
                      <MenuLink
                        href="/admin/support"
                        onClick={closeMenu}
                        icon={<svg {...iconProps}><path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" /><path d="M3 13h5l1 2h6l1-2h5" /></svg>}
                        trailing={admin.openSupport > 0 ? <span className="ml-auto rounded-full bg-accent-blue px-2 text-xs font-semibold text-accent-fg">{admin.openSupport}</span> : null}
                      >
                        Support inbox
                      </MenuLink>
                    </>
                  ) : null}

                  <div className="my-1 h-px bg-dark-subtle" />
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void signOut({ redirectUrl: "/" });
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-dark-tertiary"
                  >
                    <span className="text-fg-secondary">
                      <svg {...iconProps}><path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9" /></svg>
                    </span>
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="btn-primary !px-4 !py-2 text-sm">
                Sign in
              </button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </nav>
  );
}
