'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SignInRequired from '~/app/_components/SignInRequired';
import { SYSTEM_SENDER_ID } from '~/server/chat';

interface ProjectConversation {
  id: number;
  name: string | null;
}

interface DirectThread {
  id: number;
  otherUserId: string;
  otherName: string;
  lastMessageAt: string | null;
  unread: boolean;
}

/** One row in the list: a project's team chat, or a direct message with one person. */
interface ChatItem {
  key: string;
  kind: 'team' | 'direct';
  id: number;
  name: string;
  unread: boolean;
  otherUserId?: string;
}

/** A message in either kind of chat, normalised for display. */
interface ChatMessage {
  id: number;
  mine: boolean;
  system: boolean;
  senderName: string | null;
  message: string;
  createdAt: string;
}

interface TeamMessage {
  id: number;
  clerkUserId: string;
  message: string;
  createdAt: string;
  senderName: string | null;
}

interface DirectMessageRow {
  id: number;
  mine: boolean;
  message: string;
  createdAt: string;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

function MessagesContent() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const searchParams = useSearchParams();
  const requestedDm = Number.parseInt(searchParams.get('dm') ?? '', 10);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Phones show either the list or one chat.
  const [showThread, setShowThread] = useState(false);
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const selected = items.find((item) => item.key === selectedKey) ?? null;

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();

    const load = async () => {
      try {
        const dmUrl = Number.isNaN(requestedDm) ? '/api/dm' : `/api/dm?include=${requestedDm}`;
        const [teamRes, dmRes] = await Promise.all([
          fetch('/api/conversations', { signal: controller.signal }),
          fetch(dmUrl, { signal: controller.signal }),
        ]);
        if (!teamRes.ok) throw new Error('Failed to load your chats');

        const teams = ((await teamRes.json()) as ProjectConversation[]).map<ChatItem>((conversation) => ({
          key: `team-${conversation.id}`,
          kind: 'team',
          id: conversation.id,
          name: conversation.name ?? 'Untitled project',
          unread: false,
        }));
        const directs = dmRes.ok
          ? ((await dmRes.json()) as DirectThread[]).map<ChatItem>((thread) => ({
              key: `dm-${thread.id}`,
              kind: 'direct',
              id: thread.id,
              name: thread.otherName,
              unread: thread.unread,
              otherUserId: thread.otherUserId,
            }))
          : [];

        const all = [...directs, ...teams];
        setItems(all);

        const wanted = !Number.isNaN(requestedDm) ? `dm-${requestedDm}` : null;
        if (wanted && all.some((item) => item.key === wanted)) {
          setSelectedKey(wanted);
          setShowThread(true);
        } else if (all[0] && window.matchMedia('(min-width: 768px)').matches) {
          // On wide screens open the first chat straight away.
          setSelectedKey((current) => current ?? all[0]!.key);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load your chats');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [isSignedIn, requestedDm]);

  const loadMessages = useCallback(
    async (item: ChatItem, signal?: AbortSignal) => {
      try {
        if (item.kind === 'team') {
          const res = await fetch(`/api/messages?projectId=${item.id}`, { signal });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as TeamMessage[];
          setMessages(
            data.reverse().map((message) => ({
              id: message.id,
              mine: message.clerkUserId === userId,
              system: message.clerkUserId === SYSTEM_SENDER_ID,
              senderName: message.senderName ?? message.clerkUserId.slice(0, 8),
              message: message.message,
              createdAt: message.createdAt,
            })),
          );
        } else {
          const res = await fetch(`/api/dm/${item.id}`, { signal });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as DirectMessageRow[];
          setMessages(data.map((message) => ({ ...message, system: false, senderName: item.name })));
          setItems((prev) => prev.map((entry) => (entry.key === item.key ? { ...entry, unread: false } : entry)));
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') console.error('Failed to load messages:', err);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!selected || !isSignedIn) return;
    setMessages([]);
    setMessagesLoading(true);
    const controller = new AbortController();
    void loadMessages(selected, controller.signal).finally(() => setMessagesLoading(false));
    const interval = setInterval(() => void loadMessages(selected, controller.signal), 3000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
    // Reload when the chosen chat changes, not when its unread flag flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.key, isSignedIn, loadMessages]);

  // Only scroll when a new message arrives, so reading older ones isn't interrupted by polling.
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId, selectedKey]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !input.trim() || sending) return;
    setSending(true);
    try {
      const res =
        selected.kind === 'team'
          ? await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: selected.id, message: input }),
            })
          : await fetch(`/api/dm/${selected.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: input }),
            });
      if (!res.ok) throw new Error(await res.text());
      setInput('');
      await loadMessages(selected);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (isLoaded && !isSignedIn) {
    return <SignInRequired title="Sign in to see your messages" message="Every project you own or join gets a team chat here." />;
  }

  const visible = items.filter((item) => item.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const participants = new Set(messages.filter((message) => !message.system).map((message) => (message.mine ? 'me' : message.senderName)));

  return (
    <main className="bg-dark-primary pt-14 text-fg">
      <div className="mx-auto flex h-[calc(100dvh-3.5rem-4.75rem-env(safe-area-inset-bottom))] max-w-[90rem] md:h-[calc(100dvh-3.5rem)]">
        {/* Conversation list */}
        <aside className={`${showThread ? 'hidden' : 'flex'} w-full shrink-0 flex-col border-dark-subtle md:flex md:w-80 md:border-r`}>
          <div className="px-4 pb-3 pt-6">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Messages</h1>
            <div className="relative mt-4">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search chats"
                aria-label="Search chats"
                className="w-full rounded-full bg-dark-tertiary py-2.5 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-dark-muted focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {loading ? (
              <div className="space-y-2 px-2 pt-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-dark-tertiary" />
                ))}
              </div>
            ) : error ? (
              <p className="px-3 py-4 text-sm text-danger">{error}</p>
            ) : visible.length === 0 ? (
              <p className="px-3 py-4 text-sm text-fg-secondary">{items.length === 0 ? 'No chats yet.' : 'No chats match.'}</p>
            ) : (
              visible.map((item) => {
                const active = item.key === selectedKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedKey(item.key);
                      setShowThread(true);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-dark-tertiary' : 'hover:bg-dark-secondary'}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center text-[13px] font-semibold ${
                        item.kind === 'team'
                          ? 'rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]'
                          : 'rounded-full bg-accent-blue/12 text-accent-blue'
                      }`}
                    >
                      {initialsOf(item.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                      <span className="block text-xs text-dark-muted">{item.kind === 'team' ? 'Team chat' : 'Direct message'}</span>
                    </span>
                    {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent-blue" aria-label="Unread" /> : null}
                  </button>
                );
              })
            )}
            <p className="px-3 pt-4 text-xs leading-relaxed text-dark-muted">
              Every project gets its own team chat. Direct messages with people show up here too.
            </p>
          </div>
        </aside>

        {/* Thread */}
        <section className={`${showThread ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
          {selected ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-dark-subtle px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => setShowThread(false)} aria-label="Back to chats" className="rounded-full p-1.5 text-fg-secondary hover:bg-dark-tertiary md:hidden">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-fg">{selected.name}</p>
                    <p className="text-xs text-dark-muted">
                      {selected.kind === 'direct'
                        ? 'Direct message'
                        : `Team chat${participants.size > 0 ? ` · ${participants.size} member${participants.size === 1 ? '' : 's'}` : ''}`}
                    </p>
                  </div>
                </div>
                {selected.kind === 'team' ? (
                  <Link href={`/projects/${selected.id}`} className="btn-secondary !px-4 !py-2 text-[13px]">
                    View project
                  </Link>
                ) : (
                  <Link href={`/profile/${encodeURIComponent(selected.otherUserId ?? '')}`} className="btn-secondary !px-4 !py-2 text-[13px]">
                    View profile
                  </Link>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
                {messagesLoading && messages.length === 0 ? (
                  <div className="space-y-3">
                    <div className="h-10 w-48 animate-pulse rounded-2xl bg-dark-tertiary" />
                    <div className="ml-auto h-10 w-40 animate-pulse rounded-2xl bg-dark-tertiary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dark-tertiary text-fg">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12c0 4.4-4 8-9 8a9.9 9.9 0 01-4.3-.9L3 20l1.4-3.7C3.5 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
                      </svg>
                    </span>
                    <p className="mt-4 text-lg font-semibold tracking-tight text-fg">
                      {selected.kind === 'direct' ? `Say hi to ${selected.name}` : 'Your team chat starts here'}
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-secondary">
                      {selected.kind === 'direct'
                        ? 'Only the two of you can see this conversation.'
                        : `When people join ${selected.name}, you can all talk in this chat.`}
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-3">
                    {messages.map((message) => {
                      if (message.system) {
                        return <p key={message.id} className="py-1 text-center text-xs text-dark-muted">{message.message}</p>;
                      }
                      return (
                        <div key={message.id} className={`flex max-w-[80%] flex-col gap-1 ${message.mine ? 'items-end self-end' : 'items-start self-start'}`}>
                          {!message.mine && selected.kind === 'team' ? <p className="px-1 text-xs font-medium text-dark-muted">{message.senderName}</p> : null}
                          <p className={`break-words rounded-2xl px-4 py-2.5 text-sm ${message.mine ? 'rounded-br-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]' : 'rounded-bl-md bg-dark-tertiary text-fg'}`}>
                            {message.message}
                          </p>
                          <p className="px-1 text-[11px] text-dark-muted">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={(event) => void send(event)} className="flex items-center gap-3 border-t border-dark-subtle px-4 py-3 md:px-6">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Write a message..."
                  aria-label="Write a message"
                  maxLength={4000}
                  disabled={sending}
                  className="flex-1 rounded-full border border-dark-subtle bg-dark-primary px-5 py-3 text-sm text-fg outline-none placeholder:text-dark-muted focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] transition hover:opacity-90 disabled:opacity-40"
                >
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <p className="text-lg font-semibold tracking-tight text-fg">{items.length === 0 && !loading ? 'No chats yet' : 'Select a chat'}</p>
              <p className="mt-2 max-w-xs text-sm text-fg-secondary">
                {items.length === 0 && !loading
                  ? 'Post a project or join one to get a team chat.'
                  : 'Pick a chat on the left to read it.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-10 pt-24 text-center text-fg-secondary">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
