import LegalPageShell from "~/app/_components/LegalPageShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of kvelpo.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">Last Updated: October 28, 2026</h2>
            <p className="text-sm">
              These Terms of Service ("Terms") govern your use of the kvelpo platform ("Service," "Platform," or "App"), operated by Kvelpo SIA, a company registered in Latvia. 
              By accessing or using kvelpo, you agree to be bound by these Terms. If you disagree with any part of these terms, 
              you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-sm">
              <p>By creating an account or using kvelpo, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
              <p>You must be at least 16 years old to use this Service. By using this Service, you represent that you are at least 16 years old.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">2. Account Responsibilities</h2>
            <div className="space-y-3 text-sm">
              <p>You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring that the information you provide is accurate and complete</li>
              </ul>
              <p className="mt-4">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">3. Acceptable Use</h2>
            <div className="space-y-4 text-sm">
              <p>You agree to use the Service only for lawful purposes and in accordance with these Terms.</p>
              
              <div>
                <h3 className="font-semibold text-fg mb-2">Permitted Activities:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Create and manage projects for legitimate collaboration purposes</li>
                  <li>Apply for project roles that match your skills and interests</li>
                  <li>Communicate professionally with other users</li>
                  <li>Provide accurate information in your profile and project descriptions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-fg mb-2">Prohibited Activities:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Using the Service for any illegal or unauthorized purpose</li>
                  <li>Creating projects or content that is harmful, threatening, abusive, or discriminatory</li>
                  <li>Impersonating any person or entity or misrepresenting your affiliation</li>
                  <li>Engaging in fraud, spam, or deceptive practices</li>
                  <li>Attempting to gain unauthorized access to the Service or other users' accounts</li>
                  <li>Interfering with or disrupting the Service or servers</li>
                  <li>Using the Service to distribute malware or malicious code</li>
                  <li>Sending spam, unsolicited promotions, or harassing or abusive messages, including direct messages and team chat messages</li>
                  <li>Trying to identify people who chose to browse privately, or using information from project view insights for anything other than getting in touch about the project</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">4. User Content</h2>
            <div className="space-y-3 text-sm">
              <p>You retain ownership of any content you post on kvelpo, but you grant us the following rights:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>A worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of providing the Service</li>
                <li>The right to modify, adapt, and create derivative works from your content as necessary for technical operations</li>
              </ul>
              <p className="mt-4">You represent and warrant that you own all rights to your content or have the necessary permissions to grant these licenses.</p>
              <p className="mt-4"><strong>Messages.</strong> Each project has a team chat for the people on its team, and any two members can send each other direct messages. Direct messages are visible only to the two people in the conversation. We do not read them as a matter of course, but we may access them where needed to keep the Service secure, to investigate abuse you report to us through the support page, or to comply with the law. If either person deletes their account, the conversation is deleted for both.</p>
              <p className="mt-4"><strong>Moderation.</strong> Other users can report projects and profiles they believe break these Terms. The kvelpo team may review reported content, or content we otherwise become aware of, and may edit, hide, or remove projects and other content that violates these Terms. When we edit or remove your content, we notify you in the app and tell you why.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">5. Intellectual Property</h2>
            <div className="space-y-3 text-sm">
              <p>The Service and its original content, features, and functionality are owned by kvelpo and are protected by international copyright, trademark, and other intellectual property laws.</p>
              <p>You may not modify, reproduce, distribute, create derivative works of, publicly display, or perform any part of the Service without our prior written consent.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">6. Privacy and Data Protection</h2>
            <p className="text-sm">
              Your use of the Service is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information. 
              By using kvelpo, you agree to the collection and use of your information as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">7. Paid Services and Subscriptions</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-fg mb-2">7.1 Plans and Boosts</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Free:</strong> up to 2 active projects, applying to any project, a public profile, and a count of how many people viewed your projects.</li>
                  <li><strong>Pro:</strong> &euro;8 per month or &euro;72 per year. Includes unlimited projects, seeing who viewed your projects (subject to Section 7.5), a verified badge on your profile, priority support, and placement of your projects ahead of non-boosted projects in Explore during their first 30 days.</li>
                  <li><strong>Boost:</strong> a one-time payment for one project: &euro;4 for 7 days or &euro;7 for 14 days. During that time the project is shown at the top of Explore and search with a &quot;Featured&quot; label. Boosting a project that is already boosted adds the new days after the current period ends. Only public projects can be boosted.</li>
                </ul>
                <p className="mt-3">We do not promise any number of views, applications, or teammates from Pro or a Boost. Features and prices can change; the plans page shows what is current.</p>
              </div>

              <div>
                <h3 className="font-semibold text-fg mb-2">7.2 Prices and Taxes</h3>
                <p>Prices are in euros and include any applicable taxes, such as VAT. The price you see at checkout is the price you pay.</p>
              </div>

              <div>
                <h3 className="font-semibold text-fg mb-2">7.3 Billing, Renewal and Cancellation</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pro renews automatically every month or year, at the price in force at the time, until you cancel.</li>
                  <li>You can cancel at any time under Membership, then Manage billing. Cancellation takes effect at the end of the period you have already paid for, and you keep Pro until then.</li>
                  <li>If you switch between monthly and yearly billing, the difference is calculated proportionally.</li>
                  <li>If we change the price of a plan, we will tell you before it takes effect. The new price applies from your next renewal, and you can cancel before then.</li>
                  <li>Deleting your account cancels your subscription immediately. The unused part of the paid period is not refunded unless the law requires it.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-fg mb-2">7.4 Right of Withdrawal and Refunds</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>If you are a consumer in the EU or EEA, you generally have the right to withdraw from a purchase within 14 days without giving a reason.</li>
                  <li>When you buy Pro or a Boost, you ask us to start providing it immediately. If you withdraw from a Pro subscription within the 14 days, you pay for the service provided until then, proportionally, and we refund the rest.</li>
                  <li>For a Boost, you acknowledge that you lose your right of withdrawal once the Boost has been fully provided.</li>
                  <li>Apart from that, payments are not refundable, except where the law requires it or where we decide to, for example if a Boost did not take effect because of an error on our side.</li>
                  <li>If a boosted project is deleted, made private, or removed under Section 4 or Section 8 while a Boost is running, the rest of the Boost is not refunded, unless we removed it in error.</li>
                  <li>To make a request, contact us through the support page or at legal@kvelpo.com.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-fg mb-2">7.5 Project View Insights</h3>
                <p>When a signed-in person opens someone else&apos;s public project, we record that visit. Every project owner sees how many people viewed their project. Owners on Pro also see who viewed it. A person who has switched on &quot;Browse privately&quot; in Settings is shown to the owner only as someone with their first listed skill, for example &quot;Someone with design skills&quot;, and not by name. See our Privacy Policy for details.</p>
              </div>

              <p>Payment processing is provided by Stripe, subject to their terms and conditions. We never see or store your card details.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">8. Termination</h2>
            <div className="space-y-3 text-sm">
              <p>We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, with or without notice.</p>
              <p>For violations of these Terms we may first send you a warning through the in-app notifications. Serious or repeated violations can lead to suspension of your account (a &quot;ban&quot;): you are signed out, can no longer sign in, and your profile and projects are hidden from other users. We may lift a suspension at our discretion.</p>
              <p>If you believe a moderation decision was made in error, contact us through the support page or at legal@kvelpo.com and we will review it.</p>
              <p>Upon termination, your right to use the Service will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">9. Disclaimers and Warranties</h2>
            <div className="space-y-3 text-sm">
              <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.</p>
              <p>We do not warrant that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Service will function uninterrupted, secure, or available at any particular time or location</li>
                <li>Any errors or defects will be corrected</li>
                <li>The Service is free of viruses or other harmful components</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">10. Limitation of Liability</h2>
            <div className="space-y-3 text-sm">
              <p>To the maximum extent permitted by law, kvelpo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access to or use of our servers and/or any personal information stored therein</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">11. Indemnification</h2>
            <p className="text-sm">
              You agree to indemnify and hold harmless kvelpo and its affiliates, officers, directors, employees, agents, and licensors 
              from any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees), 
              resulting from or arising out of a) your use and access of the Service, by you or any person using your account and password; 
              b) a breach of these terms; or c) Content posted on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">12. Governing Law and Jurisdiction</h2>
            <p className="text-sm">
              These Terms shall be governed by and construed in accordance with the laws of Latvia, without regard to its conflict of law provisions.
              Any dispute arising under these Terms shall be resolved in the courts of Latvia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">13. Changes to Terms</h2>
            <p className="text-sm">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page. 
              Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-fg mb-4">14. Contact Information</h2>
            <div className="mt-4 p-4 bg-dark-tertiary rounded-lg">
              <p className="text-sm"><strong>Company:</strong> Kvelpo SIA</p>
              <p className="text-sm"><strong>Email:</strong> legal@kvelpo.com</p>
              <p className="text-sm"><strong>Address:</strong> "Melnāji", Suntažu pagasts, Ogres novads, LV-5060, Latvia</p>
            </div>
          </section>
    </LegalPageShell>
  );
}
