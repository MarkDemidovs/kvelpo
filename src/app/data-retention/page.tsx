export default function DataRetentionPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 bg-dark-primary">
      <div className="rounded-3xl border border-dark-subtle bg-dark-card p-8">
        <h1 className="text-3xl font-semibold text-dark-primary mb-8">Data Retention Policy</h1>
        
        <div className="space-y-8 text-dark-secondary">
          <section>
            <h2 className="text-xl font-semibold text-dark-primary mb-4">Last Updated: August 15, 2026</h2>
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
                <h3 className="font-semibold text-dark-primary mb-2">Account Information</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While account is active + 30 days after deletion</p>
                <p><strong>Purpose:</strong> Account management and service provision</p>
                <p><strong>Deletion:</strong> Permanent deletion within 30 days of account closure request</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Profile Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While account is active + 30 days after deletion</p>
                <p><strong>Purpose:</strong> User identity and platform functionality</p>
                <p><strong>Deletion:</strong> Deleted upon account closure or user request</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Project Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> While project exists + 30 days after deletion</p>
                <p><strong>Purpose:</strong> Project collaboration and management</p>
                <p><strong>Deletion:</strong> Deleted when project is deleted or account is closed</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Messages and Communications</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 1 year after account deletion</p>
                <p><strong>Purpose:</strong> Communication history and support</p>
                <p><strong>Deletion:</strong> Anonymized after 1 year for service improvement</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Application Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 2 years after application resolution</p>
                <p><strong>Purpose:</strong> Application history and project matching</p>
                <p><strong>Deletion:</strong> Deleted after 2 years or upon user request</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Payment and Billing Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 7 years (financial regulations)</p>
                <p><strong>Purpose:</strong> Payment processing, fraud prevention, legal compliance</p>
                <p><strong>Deletion:</strong> Retained as required by financial regulations</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Analytics and Usage Data</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 26 months (aggregated/anonymized)</p>
                <p><strong>Purpose:</strong> Service improvement and analytics</p>
                <p><strong>Deletion:</strong> Anonymized or deleted after 26 months</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Consent Records</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 3 years after consent withdrawal</p>
                <p><strong>Purpose:</strong> GDPR compliance and consent management</p>
                <p><strong>Deletion:</strong> Deleted after 3 years unless required for legal purposes</p>
              </div>

              <div className="p-4 bg-dark-tertiary rounded-lg">
                <h3 className="font-semibold text-dark-primary mb-2">Security Logs</h3>
                <p className="mb-2"><strong>Retention Period:</strong> 90 days (aggregated)</p>
                <p><strong>Purpose:</strong> Security monitoring and incident response</p>
                <p><strong>Deletion:</strong> Anonymized after 90 days</p>
              </div>
            </div>
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
              <p className="text-sm"><strong>Email:</strong> privacy@kvelpo.com</p>
              <p className="text-sm"><strong>Address:</strong> [Your Business Address]</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}