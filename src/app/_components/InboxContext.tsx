"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface ApplicationStatus {
  id: number;
  status: string;
  projectId?: number | null;
  projectName: string | null;
  roleTitle: string | null;
  message: string | null;
  appliedAt: string;
}

export interface NotificationItem {
  id: number;
  projectId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  /** Set on application notifications, with the application's current status. */
  applicationId?: number | null;
  applicationStatus?: string | null;
}

interface InboxContextValue {
  notifications: NotificationItem[];
  applications: ApplicationStatus[];
  /** Notifications the user hasn't opened yet (drives the red dot / badge). */
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const InboxContext = createContext<InboxContextValue | null>(null);

/**
 * One shared poller for notifications and sent applications, so the top bar,
 * the mobile tab bar and the inbox page agree on what is unread.
 */
export function InboxProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [applicationsRes, notificationsRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/notifications"),
      ]);

      if (!applicationsRes.ok || !notificationsRes.ok) {
        throw new Error("Failed to load inbox data");
      }

      const contentType = applicationsRes.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected response format");
      }

      setApplications((await applicationsRes.json()) as ApplicationStatus[]);
      setNotifications((await notificationsRes.json()) as NotificationItem[]);
    } catch (error) {
      console.error("Failed to load inbox data:", error);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setApplications([]);
      setNotifications([]);
      return;
    }

    void refresh();

    // Pick up notifications created by other users (new applicants,
    // accept/reject decisions) without needing a page reload.
    const interval = setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isSignedIn, refresh]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
  }, []);

  const value = useMemo<InboxContextValue>(
    () => ({
      notifications,
      applications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      refresh,
      markRead,
      markAllRead,
    }),
    [notifications, applications, refresh, markRead, markAllRead],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error("useInbox must be used inside InboxProvider");
  }
  return context;
}
