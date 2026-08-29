import { auth } from "@clerk/nextjs/server";
import { saveConsentAction } from "~/app/actions/consent";
import Link from "next/link";

export default async function ConsentPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 bg-dark-primary">
      <p className="label-eyebrow">Your privacy choices</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-dark-primary">Consent center</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-dark-secondary">
        At kvelpo, we respect your privacy and give you control over your personal data.
        Manage your consent preferences for data processing and tracking technologies.
      </p>

      <div className="mt-8 space-y-5">
        <div className="card-raised flex items-center justify-between gap-4 p-6">
          <div>
            <p className="text-xs text-dark-muted">Current status</p>
            <p className="mt-1 text-base font-semibold text-dark-primary">{userId ? "Signed in user" : "Guest user"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-muted">User ID</p>
            <p className="mt-1 font-mono text-sm text-dark-secondary">{userId ?? "Not available"}</p>
          </div>
        </div>

        <div className="card-raised p-6">
          <p className="label-eyebrow">Cookie consent</p>
          <p className="mt-3 text-sm leading-relaxed text-dark-secondary">We use cookies and similar technologies to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-dark-secondary">
            <li>Authenticate users and maintain sessions</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze usage patterns to improve our services</li>
            <li>Provide personalized content and recommendations</li>
          </ul>

          <form action={saveConsentAction} className="mt-6 space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-5">
            <input type="hidden" name="termsVersion" value="1" />
            <input type="hidden" name="privacyVersion" value="1" />

            <div className="space-y-3">
              <label htmlFor="accept" className="flex items-center gap-3 text-sm text-dark-secondary">
                <input type="radio" id="accept" name="consentAction" value="accept" className="h-4 w-4 accent-[oklch(68%_0.18_240)]" />
                <span><strong className="text-dark-primary">Accept All</strong> — allow all cookies for optimal experience</span>
              </label>

              <label htmlFor="reject" className="flex items-center gap-3 text-sm text-dark-secondary">
                <input type="radio" id="reject" name="consentAction" value="reject" className="h-4 w-4 accent-[oklch(68%_0.18_240)]" />
                <span><strong className="text-dark-primary">Reject Non-Essential</strong> — only essential cookies for basic functionality</span>
              </label>
            </div>

            <button type="submit" className="btn-primary !px-6">Save preferences</button>
          </form>
        </div>

        <div>
          <p className="label-eyebrow">Your data rights (GDPR)</p>
          <p className="mt-3 text-sm text-dark-secondary">
            Under the General Data Protection Regulation, you have the following rights. Exercise them from your{" "}
            <Link href="/profile" className="text-accent-blue hover:underline">profile settings</Link>, or by contacting{" "}
            <a href="mailto:privacy@kvelpo.com" className="text-accent-blue hover:underline">privacy@kvelpo.com</a>.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { title: "Right to Access", body: "Request a copy of your personal data" },
              { title: "Right to Rectification", body: "Correct inaccurate or incomplete data" },
              { title: "Right to Erasure", body: "Request deletion of your personal data" },
              { title: "Right to Portability", body: "Receive your data in a structured format" },
              { title: "Right to Restrict", body: "Limit processing of your personal data" },
              { title: "Right to Object", body: "Object to certain types of processing" },
            ].map((right) => (
              <div key={right.title} className="card-raised p-4.5">
                <p className="text-sm font-semibold text-dark-primary">{right.title}</p>
                <p className="mt-1 text-xs text-dark-secondary">{right.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="card-raised p-6">
            <p className="label-eyebrow">Legal basis</p>
            <div className="mt-3 space-y-2.5 text-sm text-dark-secondary">
              <p><strong className="text-dark-primary">Contract Performance:</strong> to provide the services you requested</p>
              <p><strong className="text-dark-primary">Legitimate Interests:</strong> platform security and service improvement</p>
              <p><strong className="text-dark-primary">Consent:</strong> for optional features and marketing</p>
              <p><strong className="text-dark-primary">Legal Obligation:</strong> to comply with applicable laws</p>
            </div>
          </div>
          <div className="card-raised p-6">
            <p className="label-eyebrow">Third-party services</p>
            <div className="mt-3 space-y-2.5 text-sm text-dark-secondary">
              <p><strong className="text-dark-primary">Clerk:</strong> authentication and user management</p>
              <p><strong className="text-dark-primary">Stripe:</strong> payment processing and subscription management</p>
              <p><strong className="text-dark-primary">Vercel:</strong> hosting and infrastructure services</p>
            </div>
            <p className="mt-3 text-xs text-dark-muted">Each of these services has its own privacy policy and terms of service. We encourage you to review their policies.</p>
          </div>
        </div>

        <div className="card-raised p-6">
          <p className="label-eyebrow">Data retention</p>
          <p className="mt-3 text-sm leading-relaxed text-dark-secondary">
            We retain your data only as long as necessary for the purposes outlined in our Privacy Policy. Account data
            is retained while your account is active, and permanently deleted within 30 days of account deletion,
            except as required by law.
          </p>
        </div>

        <div>
          <p className="label-eyebrow">Additional resources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/privacy" className="btn-secondary !px-4 !py-2 text-sm">Privacy Policy</Link>
            <Link href="/cookies" className="btn-secondary !px-4 !py-2 text-sm">Cookie Policy</Link>
            <Link href="/data-retention" className="btn-secondary !px-4 !py-2 text-sm">Data Retention</Link>
            <Link href="/terms" className="btn-secondary !px-4 !py-2 text-sm">Terms of Service</Link>
            <Link href="/profile" className="btn-secondary !px-4 !py-2 text-sm">Manage Account</Link>
          </div>
        </div>

        <p className="text-sm text-dark-secondary">
          For privacy-related questions or to exercise your GDPR rights, contact us at{" "}
          <a href="mailto:privacy@kvelpo.com" className="text-accent-blue hover:underline">privacy@kvelpo.com</a>.
        </p>
      </div>
    </main>
  );
}
