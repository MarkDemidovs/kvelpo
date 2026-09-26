'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { InboxSkeleton } from '~/app/_components/Skeleton';
import SignInRequired from "~/app/_components/SignInRequired";

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
    return <SignInRequired title="Sign in to access inbox" message="You need to be signed in to view your inbox." />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Inbox</h1>
        <p className="mt-2 text-dark-secondary">Notifications and your application statuses, in one place.</p>
      </div>

      {loading ? (
        <InboxSkeleton />
      ) : error ? (
        <div className="card-raised p-10 text-center text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-9">
          {/* Notifications Section */}
          <section>
            <p className="label-eyebrow">Notifications</p>
            {notifications.length === 0 ? (
              <div className="card-raised mt-4 p-6 text-center text-dark-secondary">
                No notifications yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`card-raised p-4.5 ${notification.isRead ? '' : '!border-accent-blue'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-dark-primary">{notification.message}</p>
                        <p className="mt-1.5 text-xs text-dark-muted">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => void markAsRead(notification.id)}
                          className="shrink-0 text-xs font-semibold text-accent-blue"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    {notification.projectId && (
                      <Link
                        href={`/projects/${notification.projectId}`}
                        className="mt-3 inline-block text-sm font-semibold text-accent-blue"
                      >
                        View project &rarr;
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Applications Section */}
          <section>
            <p className="label-eyebrow">Your applications</p>
            {applications.length === 0 ? (
              <div className="card-raised mt-4 p-6 text-center text-dark-secondary">
                No applications yet. Apply to projects to see your request statuses here.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {applications.map((application) => (
                  <div key={application.id} className="card-raised p-4.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark-primary">
                          {application.projectName ?? 'Unknown project'}
                        </p>
                        <p className="mt-1 text-xs text-dark-muted">
                          {application.roleTitle ?? 'Requested role'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          application.status === 'pending'
                            ? 'bg-yellow-900/50 text-yellow-400'
                            : application.status === 'accepted'
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-dark-tertiary text-dark-secondary'
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    {application.message && (
                      <p className="mt-2.5 text-sm text-dark-secondary">{application.message}</p>
                    )}
                    <p className="mt-2.5 text-xs text-dark-muted">
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
