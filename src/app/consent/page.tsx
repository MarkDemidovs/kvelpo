import { auth } from "@clerk/nextjs/server";
import { saveConsentAction } from "~/app/actions/consent";
import Link from "next/link";

export default async function ConsentPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 bg-dark-primary">
      <div className="rounded-3xl border border-dark-subtle bg-dark-card p-8">
        <h1 className="text-3xl font-semibold text-dark-primary mb-8">Consent Center</h1>
        
        <div className="space-y-8 text-dark-secondary">
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Your Privacy Choices</h2>
            <p className="text-sm">
              At kvelpo, we respect your privacy and give you control over your personal data. 
              Manage your consent preferences for data processing and tracking technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Consent Status</h2>
            <div className="p-4 bg-dark-tertiary rounded-lg">
              <p className="text-sm"><strong>Current Status:</strong> {userId ? "Signed in user" : "Guest user"}</p>
              <p className="text-sm mt-2"><strong>User ID:</strong> {userId ?? "Not available"}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Cookie Consent</h2>
            <div className="space-y-4 text-sm">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authenticate users and maintain sessions</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Provide personalized content and recommendations</li>
              </ul>
              
              <form
                action={saveConsentAction}
                className="mt-6 space-y-4 rounded-xl border border-dark-subtle bg-dark-tertiary p-6"
              >
                <input type="hidden" name="termsVersion" value="1" />
                <input type="hidden" name="privacyVersion" value="1" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="accept"
                      name="consentAction"
                      value="accept"
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="accept" className="text-sm">
                      <strong>Accept All</strong> - Allow all cookies for optimal experience
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="reject"
                      name="consentAction"
                      value="reject"
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="reject" className="text-sm">
                      <strong>Reject Non-Essential</strong> - Only essential cookies for basic functionality
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-accent-blue px-6 py-2 text-sm font-medium text-dark-primary hover:bg-blue-500"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Your Data Rights (GDPR)</h2>
            <div className="space-y-4 text-sm">
              <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Access</h3>
                  <p className="text-xs">Request a copy of your personal data</p>
                </div>
                
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Rectification</h3>
                  <p className="text-xs">Correct inaccurate or incomplete data</p>
                </div>
                
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Erasure</h3>
                  <p className="text-xs">Request deletion of your personal data</p>
                </div>
                
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Portability</h3>
                  <p className="text-xs">Receive your data in a structured format</p>
                </div>
                
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Restrict</h3>
                  <p className="text-xs">Limit processing of your personal data</p>
                </div>
                
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h3 className="font-semibold text-dark-primary mb-2">Right to Object</h3>
                  <p className="text-xs">Object to certain types of processing</p>
                </div>
              </div>

              <p className="mt-4">You can exercise these rights through your <Link href="/profile" className="text-accent-blue hover:underline">profile settings</Link> or by contacting privacy@kvelpo.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Data Processing Information</h2>
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Legal Basis for Processing</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Contract Performance:</strong> To provide the services you requested</li>
                  <li><strong>Legitimate Interests:</strong> Platform security and service improvement</li>
                  <li><strong>Consent:</strong> For optional features and marketing</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
                </ul>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Data Retention</h3>
                <p>We retain your data only as long as necessary for the purposes outlined in our Privacy Policy. Account data is retained while your account is active, and permanently deleted within 30 days of account deletion, except as required by law.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Third-Party Services</h2>
            <div className="space-y-3 text-sm">
              <p>We integrate with the following third-party services that may process your data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Clerk:</strong> Authentication and user management</li>
                <li><strong>Stripe:</strong> Payment processing and subscription management</li>
                <li><strong>Vercel:</strong> Hosting and infrastructure services</li>
              </ul>
              <p className="mt-4">Each of these services has its own privacy policy and terms of service. We encourage you to review their policies.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Additional Resources</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card">
                Cookie Policy
              </Link>
              <Link href="/data-retention" className="rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card">
                Data Retention
              </Link>
              <Link href="/terms" className="rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card">
                Terms of Service
              </Link>
              <Link href="/profile" className="rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card">
                Manage Account
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Contact Us</h2>
            <p className="text-sm">
              For privacy-related questions or to exercise your GDPR rights, please contact us at privacy@kvelpo.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
