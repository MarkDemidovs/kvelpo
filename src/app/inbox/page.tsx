'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SignInRequired from '~/app/_components/SignInRequired';
import { useInbox, type NotificationItem } from '~/app/_components/InboxContext';

type Filter = 'all' | 'applications' | 'updates';

const isApplication = (notification: NotificationItem) => notification.type.startsWith('application');

const timeAgo = (value: string) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
};

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

function NotificationRow({ notification, onOpen }: { notification: NotificationItem; onOpen: (notification: NotificationItem) => void }) {
  const application = isApplication(notification);
  return (
    <div className={`flex items-start gap-4 p-5 ${notification.isRead ? '' : 'bg-accent-blue/[0.07]'}`}>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${application ? 'bg-accent-blue/12 text-accent-blue' : 'bg-success-bg text-success'}`}>
        {application ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug text-fg">{notification.message}</p>
        <p className="mt-1 text-xs text-dark-muted">
          {timeAgo(notification.createdAt)} &middot; {application ? 'Application' : 'Project update'}
        </p>
        {notification.projectId ? (
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className="mt-3 rounded-full border border-dark-subtle px-4 py-1.5 text-[13px] font-medium text-fg transition hover:border-dark-muted"
          >
            {application ? 'Review application' : 'View project'}
          </button>
        ) : null}
      </div>
      {!notification.isRead ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-blue" aria-label="Unread" /> : null}
    </div>
  );
}

export default function InboxPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { notifications, applications, unreadCount, markRead, markAllRead } = useInbox();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: notifications.length,
      applications: notifications.filter(isApplication).length,
      updates: notifications.filter((notification) => !isApplication(notification)).length,
    }),
    [notifications],
  );

  const visible = notifications.filter((notification) =>
    filter === 'all' ? true : filter === 'applications' ? isApplication(notification) : !isApplication(notification),
  );
  const today = visible.filter((notification) => isToday(notification.createdAt));
  const earlier = visible.filter((notification) => !isToday(notification.createdAt));

  if (isLoaded && !isSignedIn) {
    return <SignInRequired title="Sign in to access your inbox" message="You need to be signed in to view your inbox." />;
  }

  const open = (notification: NotificationItem) => {
    void markRead(notification.id);
    if (notification.projectId) {
      router.push(`/projects/${notification.projectId}${isApplication(notification) ? '?tab=applications' : ''}`);
    }
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'applications', label: 'Applications' },
    { value: 'updates', label: 'Project updates' },
  ];

  return (
    <main className="min-h-screen bg-dark-primary pt-14 text-fg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-10 sm:px-6 md:grid-cols-[14rem_1fr] lg:px-8">
        <aside>
          <h1 className="text-[36px] font-bold tracking-tight text-fg sm:text-[44px]">Inbox</h1>
          <p className="mt-2 text-sm text-fg-secondary">Applications and updates about your projects.</p>

          <div className="mt-6 flex gap-2 overflow-x-auto md:flex-col md:gap-1" role="tablist" aria-label="Inbox filters">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`flex shrink-0 items-center justify-between gap-6 rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                  filter === item.value ? 'bg-dark-tertiary font-medium text-fg' : 'text-fg-secondary hover:bg-dark-secondary hover:text-fg'
                }`}
              >
                {item.label}
                <span className="text-xs text-dark-muted">{counts[item.value]}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 hidden rounded-2xl bg-dark-secondary p-4 md:block">
            <p className="text-sm font-semibold text-fg">Looking for a conversation?</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-secondary">Chats with your team are in Messages.</p>
            <Link href="/chats" className="mt-3 inline-block text-[13px] font-semibold text-accent-blue hover:underline">
              Go to Messages &rarr;
            </Link>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-fg-secondary">{unreadCount} unread</p>
            {unreadCount > 0 ? (
              <button type="button" onClick={() => void markAllRead()} className="text-sm font-medium text-accent-blue hover:underline">
                Mark all as read
              </button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-dark-secondary px-6 py-14 text-center">
              <h2 className="text-lg font-semibold tracking-tight text-fg">Nothing here yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-fg-secondary">
                When someone applies to your project or your applications get a reply, you&apos;ll see it here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {today.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-fg-secondary">Today</p>
                  <div className="divide-y divide-dark-subtle overflow-hidden rounded-2xl border border-dark-subtle">
                    {today.map((notification) => <NotificationRow key={notification.id} notification={notification} onOpen={open} />)}
                  </div>
                </div>
              ) : null}
              {earlier.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-fg-secondary">Earlier</p>
                  <div className="divide-y divide-dark-subtle overflow-hidden rounded-2xl border border-dark-subtle">
                    {earlier.map((notification) => <NotificationRow key={notification.id} notification={notification} onOpen={open} />)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {filter !== 'updates' && applications.length > 0 ? (
            <div className="mt-10">
              <p className="mb-2 text-xs font-medium text-fg-secondary">Your applications</p>
              <div className="divide-y divide-dark-subtle overflow-hidden rounded-2xl border border-dark-subtle">
                {applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-fg">{application.projectName ?? 'Unknown project'}</p>
                      <p className="mt-0.5 text-xs text-dark-muted">
                        {application.roleTitle ?? 'Requested role'} &middot; Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        application.status === 'pending'
                          ? 'bg-warning-bg text-warning'
                          : application.status === 'accepted'
                            ? 'bg-success-bg text-success'
                            : 'bg-dark-tertiary text-fg-secondary'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
