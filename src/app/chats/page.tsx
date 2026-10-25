'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import SignInRequired from '~/app/_components/SignInRequired';
import { SYSTEM_SENDER_ID } from '~/server/chat';

interface Conversation {
  id: number;
  name: string | null;
}

interface Message {
  id: number;
  projectId: number;
  clerkUserId: string;
  message: string;
  createdAt: string;
  senderName: string | null;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

export default function MessagesPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Phones show either the list or one chat.
  const [showThread, setShowThread] = useState(false);
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch('/api/conversations', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load your chats');
        const data = (await res.json()) as Conversation[];
        setConversations(data);
        // On wide screens open the first chat straight away.
        if (data[0] && window.matchMedia('(min-width: 768px)').matches) setSelectedId(data[0].id);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load your chats');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isSignedIn]);

  useEffect(() => {
    if (!selectedId || !isSignedIn) return;
    setMessagesLoading(true);
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(`/api/messages?projectId=${selectedId}`, { signal: controller.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Message[];
        setMessages(data.reverse());
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') console.error('Failed to load messages:', err);
      }
    };

    void load().finally(() => setMessagesLoading(false));
    const interval = setInterval(() => void load(), 3000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [selectedId, isSignedIn]);

  // Only scroll when a new message arrives, so reading older ones isn't interrupted by polling.
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId, selectedId]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedId, message: input }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInput('');
      const refreshed = await fetch(`/api/messages?projectId=${selectedId}`);
      if (refreshed.ok) setMessages(((await refreshed.json()) as Message[]).reverse());
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (isLoaded && !isSignedIn) {
    return <SignInRequired title="Sign in to see your messages" message="Every project you own or join gets a team chat here." />;
  }

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const visible = conversations.filter((conversation) => (conversation.name ?? '').toLowerCase().includes(filter.trim().toLowerCase()));
  const participants = new Set(messages.filter((message) => message.clerkUserId !== SYSTEM_SENDER_ID).map((message) => message.clerkUserId));

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
              <p className="px-3 py-4 text-sm text-fg-secondary">{conversations.length === 0 ? 'No chats yet.' : 'No chats match.'}</p>
            ) : (
              visible.map((conversation) => {
                const name = conversation.name ?? 'Untitled project';
                const active = conversation.id === selectedId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(conversation.id);
                      setShowThread(true);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-dark-tertiary' : 'hover:bg-dark-secondary'}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--btn-primary-bg)] text-[13px] font-semibold text-[var(--btn-primary-fg)]">
                      {initialsOf(name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-fg">{name}</span>
                      <span className="block text-xs text-dark-muted">Team chat</span>
                    </span>
                  </button>
                );
              })
            )}
            <p className="px-3 pt-4 text-xs leading-relaxed text-dark-muted">
              Every project gets its own team chat.
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
                    <p className="truncate text-[15px] font-semibold text-fg">{selected.name ?? 'Untitled project'}</p>
                    <p className="text-xs text-dark-muted">
                      Team chat{participants.size > 0 ? ` · ${participants.size} member${participants.size === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                </div>
                <Link href={`/projects/${selected.id}`} className="btn-secondary !px-4 !py-2 text-[13px]">
                  View project
                </Link>
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
                    <p className="mt-4 text-lg font-semibold tracking-tight text-fg">Your team chat starts here</p>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-secondary">
                      When people join {selected.name ?? 'this project'}, you can all talk in this chat.
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-3">
                    {messages.map((message) => {
                      if (message.clerkUserId === SYSTEM_SENDER_ID) {
                        return <p key={message.id} className="py-1 text-center text-xs text-dark-muted">{message.message}</p>;
                      }
                      const mine = message.clerkUserId === userId;
                      return (
                        <div key={message.id} className={`flex max-w-[80%] flex-col gap-1 ${mine ? 'items-end self-end' : 'items-start self-start'}`}>
                          {!mine ? <p className="px-1 text-xs font-medium text-dark-muted">{message.senderName ?? message.clerkUserId.slice(0, 8)}</p> : null}
                          <p className={`break-words rounded-2xl px-4 py-2.5 text-sm ${mine ? 'rounded-br-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]' : 'rounded-bl-md bg-dark-tertiary text-fg'}`}>
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
              <p className="text-lg font-semibold tracking-tight text-fg">{conversations.length === 0 && !loading ? 'No chats yet' : 'Select a chat'}</p>
              <p className="mt-2 max-w-xs text-sm text-fg-secondary">
                {conversations.length === 0 && !loading
                  ? 'Post a project or join one to get a team chat.'
                  : 'Pick a project on the left to see its team chat.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
