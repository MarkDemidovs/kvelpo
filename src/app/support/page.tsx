import type { Metadata } from "next";
import { SUPPORT_EMAILS } from "~/lib/support";
import SupportForm from "./SupportForm";

export const metadata: Metadata = {
  title: "Contact support",
  description: "Questions, problems, or feedback? Message the kvelpo team and we'll reply by email.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  const mailto = `mailto:${SUPPORT_EMAILS.join(",")}?subject=${encodeURIComponent("kvelpo support")}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="label-eyebrow">Support</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-dark-primary">How can we help?</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-dark-secondary">
        Questions, something not working, or an idea for kvelpo? Send us a message. It goes straight to the two of us who
        build kvelpo, and we&apos;ll reply to your email, usually within a day or two.
      </p>

      <SupportForm />

      <div className="card-raised mt-6 p-6">
        <p className="text-sm font-medium text-dark-primary">Prefer email?</p>
        <p className="mt-1 text-sm text-dark-secondary">
          Write to{" "}
          {SUPPORT_EMAILS.map((email, i) => (
            <span key={email}>
              {i > 0 ? " and " : ""}
              <a href={`mailto:${email}`} className="text-accent-blue hover:underline">
                {email}
              </a>
            </span>
          ))}
          .
        </p>
        <a href={mailto} className="btn-secondary mt-4 inline-flex !px-4 !py-2 text-sm">
          Email us both
        </a>
      </div>
    </main>
  );
}
