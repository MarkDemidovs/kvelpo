"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, type FormEvent } from "react";
import { MAX_SUPPORT_MESSAGE, SUPPORT_TOPICS, type SupportTopic } from "~/lib/support";

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-tertiary px-3.5 py-2.5 text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue";

export default function SupportForm() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<SupportTopic | "">("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Prefill from the signed-in account, without overwriting anything typed.
  useEffect(() => {
    if (!user) return;
    setName((current) => current || (user.fullName ?? ""));
    setEmail((current) => current || (user.primaryEmailAddress?.emailAddress ?? ""));
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't send your message. Please email us directly.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="card-raised mt-8 p-7 text-center">
        <p className="text-lg font-semibold text-dark-primary">Thanks, your message is on its way.</p>
        <p className="mt-2 text-sm text-dark-secondary">
          We&apos;ll reply to <span className="text-dark-primary">{email}</span>. Keep an eye on your spam folder just in case.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised mt-8 space-y-5 p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-dark-secondary">Name</span>
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={256} autoComplete="name" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-dark-secondary">Email *</span>
          <input
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={320}
            autoComplete="email"
            placeholder="So we can reply"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-dark-secondary">Topic *</span>
        <select
          className={fieldClass}
          value={topic}
          onChange={(e) => setTopic(e.target.value as SupportTopic | "")}
          required
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {(Object.entries(SUPPORT_TOPICS) as [SupportTopic, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-dark-secondary">Message *</span>
        <textarea
          className={fieldClass}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={MAX_SUPPORT_MESSAGE}
          placeholder="Tell us what's going on. For a problem, what did you expect and what happened instead?"
        />
      </label>

      {/* Honeypot: off-screen and skipped by keyboard/screen readers. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button type="submit" disabled={sending} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
        {sending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
