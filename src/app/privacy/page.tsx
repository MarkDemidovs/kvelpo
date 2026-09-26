import LegalPageShell from "~/app/_components/LegalPageShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How kvelpo collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Last Updated: September 26, 2026</h2>
            <p className="text-sm">
              This Privacy Policy explains how kvelpo ("we," "our," or "us") collects, uses, and protects your personal information. 
              This policy applies to our service and complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">1. Data Controller</h2>
            <p className="text-sm">
              <strong>Kvelpo SIA</strong>, registered in Latvia at "Melnāji", Suntažu pagasts, Ogres novads, LV-5060, Latvia, operates kvelpo and is the data controller responsible for your personal information.
              For privacy-related inquiries, please contact us at privacy@kvelpo.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-dark-primary mb-2">2.1 Account Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email address and user identifier (via Clerk authentication)</li>
                  <li>Profile information: full name, profile picture (from your sign-in account), bio, skills, links, and work experience (job titles, organizations, locations, dates, and descriptions you add)</li>
                  <li>Membership and subscription details</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-dark-primary mb-2">2.2 Project Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Project names, descriptions, and tags</li>
                  <li>Role requirements and applications</li>
                  <li>Project collaboration data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-dark-primary mb-2">2.3 Technical Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>IP address and location data (for EU compliance detection)</li>
                  <li>Device and browser information</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">3. Legal Basis for Processing (GDPR Article 6)</h2>
            <div className="space-y-3 text-sm">
              <p><strong>Contract Performance:</strong> We process your data to provide the services you've requested.</p>
              <p><strong>Legitimate Interests:</strong> We process data for platform security, fraud prevention, and service improvement.</p>
              <p><strong>Consent:</strong> For optional, non-essential cookies where required.</p>
              <p><strong>Legal Obligation:</strong> To comply with applicable laws and regulations.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">4. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Provide and maintain our platform services</li>
              <li>Process payments and manage subscriptions (via Stripe)</li>
              <li>Authenticate users and secure accounts (via Clerk)</li>
              <li>Facilitate project collaboration and communication</li>
              <li>Send service-related notifications and updates</li>
              <li>Analyze usage patterns to improve our services</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">5. Data Sharing and Third Parties</h2>
            <div className="space-y-4 text-sm">
              <p>We share your data only with the following trusted third parties:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Clerk:</strong> Authentication and user management</li>
                <li><strong>Stripe:</strong> Payment processing and subscription management</li>
                <li><strong>Vercel:</strong> Hosting and infrastructure services</li>
              </ul>
              <p>We do not sell your personal information to third parties for their marketing purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">6. International Data Transfers</h2>
            <p className="text-sm">
              Your data may be transferred to and processed in countries outside the European Economic Area (EEA). 
              We ensure adequate protection through appropriate safeguards, including Standard Contractual Clauses (SCCs) 
              and compliance with GDPR requirements for international data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">7. Data Retention</h2>
            <div className="space-y-3 text-sm">
              <p>We retain your personal information only as long as necessary for the purposes outlined in this policy:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account and Profile Data:</strong> Retained while your account is active</li>
                <li><strong>Project Data:</strong> Retained until you delete the project or your account</li>
                <li><strong>Messages and Applications:</strong> Anonymized (disassociated from your identity) immediately when your account is deleted, rather than deleted outright, so the other party's conversation or application history stays intact</li>
                <li><strong>Consent Records:</strong> Deleted immediately when your account is deleted</li>
                <li><strong>Payment Data:</strong> Held by our payment processor, Stripe, as required by financial regulations (typically 7 years); we do not store your card details ourselves</li>
              </ul>
              <p>Deleting your account permanently and immediately erases your profile and projects and deletes you from our authentication provider. There is no grace period, and this cannot be undone.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">8. Your GDPR Rights</h2>
            <div className="space-y-3 text-sm">
              <p>Under the GDPR, you have the following rights:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Portability:</strong> Request transfer of your data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Object:</strong> Object to certain types of processing</li>
              </ul>
              <p className="mt-4">You can exercise these rights through your profile settings or by contacting privacy@kvelpo.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">9. Cookies and Tracking</h2>
            <div className="space-y-3 text-sm">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authentication and session management</li>
                <li>Remembering your preferences and consent choices</li>
              </ul>
              <p>We do not currently use analytics, advertising, or tracking cookies. See our <strong>Cookie Policy</strong> for full details.</p>
              <p>You can manage cookie preferences through our consent banner or browser settings.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">10. Data Security</h2>
            <p className="text-sm">
              We implement appropriate technical and organizational measures to protect your personal data, including:
              encryption, secure authentication protocols, regular security assessments, and access controls. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">11. Children's Privacy</h2>
            <p className="text-sm">
              Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. 
              If we become aware of such collection, we will take immediate steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">12. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy 
              on this page and updating the "Last Updated" date. Continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">13. Contact Information</h2>
            <p className="text-sm">
              For any privacy-related questions or to exercise your GDPR rights, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-dark-tertiary rounded-lg">
              <p className="text-sm"><strong>Company:</strong> Kvelpo SIA</p>
              <p className="text-sm"><strong>Email:</strong> privacy@kvelpo.com</p>
              <p className="text-sm"><strong>Address:</strong> "Melnāji", Suntažu pagasts, Ogres novads, LV-5060, Latvia</p>
            </div>
          </section>
    </LegalPageShell>
  );
}
