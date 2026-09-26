import LegalPageShell from "~/app/_components/LegalPageShell";

export default function DataRetentionPage() {
  return (
    <LegalPageShell title="Data Retention Policy">
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Last Updated: September 26, 2026</h2>
            <p className="text-sm">
              This Data Retention Policy explains how long kvelpo retains your personal information and the criteria we use for deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">1. Data Retention Principles</h2>
            <div className="space-y-3 text-sm">
              <p>We follow these principles for data retention:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Minimization:</strong> We collect only data necessary for our services</li>
                <li><strong>Necessity:</strong> We retain data only as long as needed for its purpose</li>
                <li><strong>Security:</strong> Data is securely deleted when retention period ends</li>
                <li><strong>Transparency:</strong> Clear retention periods for different data types</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">2. Retention Periods by Data Type</h2>
            <div className="space-y-4 text-sm">
              
              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Account and Profile Information</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While your account is active</p>
                <p><strong>Purpose:</strong> Account management and service provision</p>
                <p><strong>Deletion:</strong> Permanently and immediately deleted the moment you delete your account. There is no grace period</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Project Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While the project exists</p>
                <p><strong>Purpose:</strong> Project collaboration and management</p>
                <p><strong>Deletion:</strong> Deleted immediately when you delete the project or your account</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Messages and Applications</h3>
                <p className="mb-2"><strong>Retention Period:</strong> Until account deletion, then indefinitely in anonymized form</p>
                <p><strong>Purpose:</strong> Preserving the other party's conversation or application history</p>
                <p><strong>Deletion:</strong> Immediately disassociated from your identity when you delete your account. The message or application text remains, but is no longer linked to you</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Payment and Billing Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 7 years (financial regulations)</p>
                <p><strong>Purpose:</strong> Payment processing, fraud prevention, legal compliance</p>
                <p><strong>Deletion:</strong> Held by our payment processor, Stripe, as required by financial regulations; we do not store your card details ourselves</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Consent Records</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While your account exists</p>
                <p><strong>Purpose:</strong> GDPR compliance and consent management</p>
                <p><strong>Deletion:</strong> Deleted immediately when you delete your account</p>
              </div>
            </div>

            <p className="mt-4 text-sm">
              We do not currently collect analytics or usage-tracking data, so no separate analytics retention period applies. If that changes, we will update this policy first.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">3. Early Deletion Criteria</h2>
            <div className="space-y-3 text-sm">
              <p>We may delete data earlier than the stated retention periods when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The data is no longer needed for its original purpose</li>
                <li>You withdraw your consent for processing (where applicable)</li>
                <li>We receive a deletion request from you</li>
                <li>The data is inaccurate, incomplete, or irrelevant</li>
                <li>Retaining the data poses an unacceptable security risk</li>
                <li>Required by applicable law or regulation</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">4. Data Deletion Process</h2>
            <div className="space-y-3 text-sm">
              <p>When data is deleted, we:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Remove it from active databases and production systems</li>
                <li>Delete it from backups within the retention period</li>
                <li>Erase it from any third-party services where feasible</li>
                <li>Securely wipe storage media when physical media is disposed</li>
              </ul>
              <p className="mt-4">For certain data types like payment records, we may retain anonymized/aggregated data for business intelligence and compliance purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">5. Your Right to Deletion</h2>
            <div className="space-y-3 text-sm">
              <p>Under GDPR, you have the right to request deletion of your personal data ("Right to be Forgotten"). You can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Delete your entire account through profile settings</li>
                <li>Request specific data deletion through privacy@kvelpo.com</li>
                <li>Withdraw consent to stop further processing</li>
              </ul>
              <p className="mt-4">We will respond to deletion requests within 30 days, subject to any legal obligations we may have to retain certain data.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">6. Exceptions to Deletion</h2>
            <div className="space-y-3 text-sm">
              <p>We may retain data beyond the stated periods when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Legal Requirements:</strong> Required by law, court order, or government regulation</li>
                <li><strong>Security Purposes:</strong> Necessary for fraud prevention, security threats, or technical issues</li>
                <li><strong>Business Operations:</strong> Essential for legitimate business interests where deletion would impair our ability to provide services</li>
                <li><strong>Contractual Obligations:</strong> Required to fulfill our contractual obligations to you</li>
                <li><strong>Dispute Resolution:</strong> Needed to establish, exercise, or defend legal claims</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">7. Data Anonymization</h2>
            <div className="space-y-3 text-sm">
              <p>Where possible, we anonymize or pseudonymize data before long-term retention. This means:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Removing personally identifiable information</li>
                <li>Using unique identifiers instead of personal data</li>
                <li>Aggregating data to prevent identification of individuals</li>
                <li>Applying statistical techniques to prevent re-identification</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">8. Updates to This Policy</h2>
            <p className="text-sm">
              We may update this Data Retention Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">9. Contact Information</h2>
            <div className="mt-4 p-4 bg-dark-tertiary rounded-lg">
              <p className="text-sm"><strong>Company:</strong> Kvelpo SIA</p>
              <p className="text-sm"><strong>Email:</strong> privacy@kvelpo.com</p>
              <p className="text-sm"><strong>Address:</strong> "Melnāji", Suntažu pagasts, Ogres novads, LV-5060, Latvia</p>
            </div>
          </section>
    </LegalPageShell>
  );
}