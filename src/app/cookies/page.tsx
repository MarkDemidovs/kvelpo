import Link from "next/link";
import LegalPageShell from "~/app/_components/LegalPageShell";

export default function CookiesPage() {
  return (
    <LegalPageShell title="Cookie Policy">
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Last Updated: August 15, 2026</h2>
            <p className="text-sm">
              This Cookie Policy explains how kvelpo uses cookies and similar technologies to collect, store, and process your information. 
              This policy is designed to comply with the General Data Protection Regulation (GDPR) and ePrivacy Directive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">1. What Are Cookies?</h2>
            <div className="space-y-3 text-sm">
              <p>Cookies are small text files that are stored on your device when you visit websites. They are widely used to make websites work more efficiently and to provide information to website owners.</p>
              <p>Similar technologies include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Local Storage:</strong> Browser storage for application data</li>
                <li><strong>Session Storage:</strong> Temporary browser storage for session data</li>
                <li><strong>Web Beacons:</strong> Small transparent images used for tracking</li>
                <li><strong>Fingerprinting:</strong> Device identification techniques</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">2. How We Use Cookies</h2>
            <div className="space-y-4 text-sm">
              <p>We use cookies for the following purposes:</p>
              
              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Essential Cookies (Required)</h3>
                <p className="mb-2">These cookies are necessary for the website to function properly. They enable:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>User authentication and session management (via Clerk)</li>
                  <li>Security and fraud prevention</li>
                  <li>Basic functionality and navigation</li>
                </ul>
                <p className="mt-2"><strong>Processing Basis:</strong> Contract performance and legitimate interests</p>
                <p><strong>Consent Required:</strong> No (automatically applied)</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Functional Cookies</h3>
                <p className="mb-2">These cookies enable enhanced functionality and personalization:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Remembering your preferences and settings</li>
                  <li>Language and theme selections</li>
                  <li>Remembering your consent preferences</li>
                </ul>
                <p className="mt-2"><strong>Processing Basis:</strong> Legitimate interests</p>
                <p><strong>Consent Required:</strong> No (can be disabled in settings)</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Analytics Cookies</h3>
                <p className="mb-2">These cookies help us understand how users interact with our service:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Page visit statistics and user behavior</li>
                  <li>Performance monitoring and error tracking</li>
                  <li>A/B testing and feature optimization</li>
                </ul>
                <p className="mt-2"><strong>Processing Basis:</strong> Legitimate interests</p>
                <p><strong>Consent Required:</strong> Yes (for EU users)</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Marketing Cookies</h3>
                <p className="mb-2">These cookies are used for advertising and personalization:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Personalized content and recommendations</li>
                  <li>Cross-site tracking for advertising</li>
                  <li>Social media integration</li>
                </ul>
                <p className="mt-2"><strong>Processing Basis:</strong> Consent</p>
                <p><strong>Consent Required:</strong> Yes (for EU users)</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">3. Third-Party Cookies</h2>
            <div className="space-y-3 text-sm">
              <p>We allow certain third parties to place cookies on your device:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Clerk:</strong> Authentication and session management</li>
                <li><strong>Stripe:</strong> Payment processing and security</li>
                <li><strong>Vercel:</strong> Performance monitoring and analytics</li>
              </ul>
              <p className="mt-4">These third parties have their own privacy policies and cookie policies. We encourage you to review their policies for detailed information.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">4. Cookie Duration</h2>
            <div className="space-y-3 text-sm">
              <p>Our cookies have different durations depending on their purpose:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Session Cookies:</strong> Expire when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Expire after 30 days to 1 year</li>
                <li><strong>Authentication Cookies:</strong> Expire after 7 days to 30 days</li>
                <li><strong>Consent Cookies:</strong> Expire after 1 year</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">5. Managing Your Cookie Preferences</h2>
            <div className="space-y-3 text-sm">
              <p>You have several options to manage cookies:</p>
              
              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Through Our Consent Banner</h3>
                <p>You can accept or reject non-essential cookies when you first visit our site (for EU users). You can change your preferences anytime in our <Link href="/consent" className="text-accent-blue hover:underline">Consent Center</Link>.</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Through Browser Settings</h3>
                <p>Most web browsers allow you to control cookies through their settings. You can:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Block all cookies</li>
                  <li>Delete existing cookies</li>
                  <li>Set notifications when cookies are set</li>
                  <li>Block third-party cookies</li>
                </ul>
                <p className="mt-2">Note that blocking essential cookies may affect your ability to use our service.</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Through Device Settings</h3>
                <p>Mobile devices also have cookie management options in their browser settings.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">6. Your Rights Under GDPR</h2>
            <div className="space-y-3 text-sm">
              <p>Under the GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Withdraw your consent at any time</li>
                <li>Access information about cookies we use</li>
                <li>Request deletion of your data processed via cookies</li>
                <li>Object to certain types of cookie processing</li>
              </ul>
              <p className="mt-4">You can exercise these rights through our <Link href="/consent" className="text-accent-blue hover:underline">Consent Center</Link> or by contacting privacy@kvelpo.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">7. Updates to This Policy</h2>
            <p className="text-sm">
              We may update this Cookie Policy from time to time to reflect changes in our practices, technology, or legal requirements. 
              We will notify you of any material changes by posting the updated policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">8. Contact Information</h2>
            <div className="mt-4 p-4 bg-dark-tertiary rounded-lg">
              <p className="text-sm"><strong>Email:</strong> privacy@kvelpo.com</p>
              <p className="text-sm"><strong>Address:</strong> [Your Business Address]</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">9. Additional Resources</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="btn-secondary !px-4 !py-2 text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="btn-secondary !px-4 !py-2 text-sm">
                Terms of Service
              </Link>
              <Link href="/consent" className="btn-secondary !px-4 !py-2 text-sm">
                Consent Center
              </Link>
            </div>
          </section>
    </LegalPageShell>
  );
}