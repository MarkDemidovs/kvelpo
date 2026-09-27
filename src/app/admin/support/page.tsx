import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { supportMessages } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";
import { isSupportTopic, SUPPORT_EMAILS, SUPPORT_TOPICS } from "~/lib/support";
import StatusButton from "../StatusButton";

export const metadata: Metadata = {
  title: "Support inbox",
  robots: { index: false, follow: false },
};

// Always read fresh data; this page is only for the admins.
export const dynamic = "force-dynamic";

type SupportMessage = typeof supportMessages.$inferSelect;

const formatDate = (date: Date) =>
  date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Riga" });

/** Opens a reply to the customer with the other team members CC'd. */
function replyHref(msg: SupportMessage, adminEmails: readonly string[]): string {
  const topic = isSupportTopic(msg.topic) ? SUPPORT_TOPICS[msg.topic] : msg.topic;
  const quoted = msg.message.split("\n").map((line) => `> ${line}`).join("\n");
  const params = new URLSearchParams({
    cc: adminEmails.join(","),
    subject: `Re: ${topic} (kvelpo support)`,
    body: `Hi${msg.name ? ` ${msg.name}` : ""},\n\n\n\nOn ${formatDate(msg.createdAt)} you wrote:\n${quoted}`,
  });
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `mailto:${encodeURIComponent(msg.email)}?${params.toString().replace(/\+/g, "%20")}`;
}

export default async function AdminSupportPage() {
  if (!(await getAdminUserId())) {
    notFound();
  }

  const [openMessages, resolvedMessages] = await Promise.all([
    db.select().from(supportMessages).where(eq(supportMessages.status, "open")).orderBy(desc(supportMessages.createdAt)),
    db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.status, "resolved"))
      .orderBy(desc(supportMessages.resolvedAt))
      .limit(50),
  ]);

  const renderMessage = (msg: SupportMessage) => (
    <li key={msg.id} className="card-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-dark-tertiary px-2.5 py-0.5 text-xs font-semibold text-accent-blue">
              {isSupportTopic(msg.topic) ? SUPPORT_TOPICS[msg.topic] : msg.topic}
            </span>
            <span className="text-xs text-dark-muted">{formatDate(msg.createdAt)}</span>
          </div>
          <p className="text-sm text-dark-primary">
            <span className="font-semibold">{msg.name ?? "No name given"}</span>{" "}
            <a href={`mailto:${msg.email}`} className="text-dark-secondary hover:text-accent-blue">
              &lt;{msg.email}&gt;
            </a>
            {msg.clerkUserId ? (
              <>
                {" · "}
                <Link href={`/profile/${encodeURIComponent(msg.clerkUserId)}`} target="_blank" className="text-xs text-dark-muted hover:text-accent-blue">
                  kvelpo profile ↗
                </Link>
              </>
            ) : (
              <span className="text-xs text-dark-muted"> · not signed in</span>
            )}
          </p>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-dark-secondary">{msg.message}</p>
          {msg.resolvedAt ? <p className="text-xs text-dark-muted">Resolved {formatDate(msg.resolvedAt)}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a href={replyHref(msg, SUPPORT_EMAILS)} className="btn-secondary !px-4 !py-2 text-sm">
            Reply by email
          </a>
          <StatusButton endpoint={`/api/admin/support/${msg.id}`} status={msg.status === "resolved" ? "resolved" : "open"} />
        </div>
      </div>
    </li>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Support inbox</h1>
      <p className="mt-2 text-dark-secondary">
        Messages from the contact form. &quot;Reply by email&quot; opens a reply to the customer with both of you CC&apos;d; mark
        the message resolved once it&apos;s handled.
      </p>

      <section className="mt-8">
        <p className="label-eyebrow">Open ({openMessages.length})</p>
        {openMessages.length === 0 ? (
          <div className="card-raised mt-4 p-8 text-center text-dark-secondary">Inbox zero. 🎉</div>
        ) : (
          <ul className="mt-4 space-y-3">{openMessages.map(renderMessage)}</ul>
        )}
      </section>

      {resolvedMessages.length > 0 ? (
        <section className="mt-10">
          <p className="label-eyebrow">Recently resolved</p>
          <ul className="mt-4 space-y-3 opacity-70">{resolvedMessages.map(renderMessage)}</ul>
        </section>
      ) : null}
    </main>
  );
}
