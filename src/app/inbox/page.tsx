'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface NotificationItem {
  id: number;
  projectId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ApplicationStatus {
  id: number;
  status: string;
  projectName: string | null;
  roleTitle: string | null;
  message: string | null;
  appliedAt: string;
}

export default function InboxPage() {
  const { isSignedIn } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInboxData = async () => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const [notificationsRes, applicationsRes] = await Promise.all([
          fetch('/api/notifications'),
          fetch('/api/applications'),
        ]);

        if (!notificationsRes.ok || !applicationsRes.ok) {
          throw new Error('Failed to fetch inbox data');
        }

        const notificationsData = await notificationsRes.json() as NotificationItem[];
        const applicationsData = await applicationsRes.json() as ApplicationStatus[];

        setNotifications(notificationsData);
        setApplications(applicationsData);
      } catch (err) {
        console.error('Failed to fetch inbox data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inbox');
      } finally {
        setLoading(false);
      }
    };

    void fetchInboxData();
  }, [isSignedIn]);

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (!isSignedIn) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-10 text-center">
          <h1 className="text-2xl font-semibold text-dark-primary mb-4">Sign in to access inbox</h1>
          <p className="text-dark-secondary">You need to be signed in to view your inbox.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-dark-primary">Inbox</h1>
        <p className="mt-2 text-dark-secondary">View your notifications and application statuses.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
          Loading inbox...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Notifications Section */}
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Notifications</h2>
            {notifications.length === 0 ? (
              <div className="rounded-3xl bg-dark-card p-6 text-center text-dark-secondary">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-3xl border p-4 transition ${
                      notification.isRead
                        ? 'border-dark-subtle bg-dark-tertiary'
                        : 'border-accent-blue bg-dark-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark-primary">{notification.message}</p>
                        <p className="mt-1 text-xs text-dark-secondary">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-accent-blue hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    {notification.projectId && (
                      <Link
                        href={`/?project=${notification.projectId}`}
                        className="mt-3 inline-block text-sm text-accent-blue hover:underline"
                      >
                        View Project →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Applications Section */}
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Your Applications</h2>
            {applications.length === 0 ? (
              <div className="rounded-3xl bg-dark-card p-6 text-center text-dark-secondary">
                No applications yet. Apply to projects to see your request statuses here.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => (
                  <div key={application.id} className="rounded-3xl border border-dark-subtle bg-dark-tertiary p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark-primary">
                          {application.projectName ?? 'Unknown project'}
                        </p>
                        <p className="mt-1 text-xs text-dark-secondary">
                          {application.roleTitle ?? 'Requested role'}
                        </p>
                      </div>
                      <span
                        key={`status-${application.id}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          application.status === 'pending'
                            ? 'bg-yellow-900/50 text-yellow-400'
                            : application.status === 'accepted'
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-dark-subtle text-dark-secondary'
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    {application.message && (
                      <p className="mt-2 text-sm text-dark-secondary">{application.message}</p>
                    )}
                    <p className="mt-2 text-xs text-dark-muted">
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}