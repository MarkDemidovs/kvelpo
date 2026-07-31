export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Kvelpo SIA Privacy Policy</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Kvelpo SIA is the data controller for the Kvelpo service. This policy explains what personal data we collect, why we collect it, how we use it, and how we protect it for users in the European Union.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Data we collect</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Kvelpo collects and processes the information required to operate the app, including:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-600">
        <li>Authentication and account data provided by Clerk, such as your user identifier.</li>
        <li>Profile information that you choose to provide, including your full name, bio, avatar URL, public status, links, and skills.</li>
        <li>Project and application metadata created in the app, including projects, role listings, applications, membership status, notifications, and messages.</li>
        <li>Cookies and browser identifiers used to remember consent decisions and keep the service functioning.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Why we process your data</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        We process your data for the following purposes:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-600">
        <li>To provide and maintain your account and the Kvelpo application.</li>
        <li>To allow you to create and manage projects, profile content, and applications.</li>
        <li>To communicate with you through notifications and account workflows.</li>
        <li>To comply with legal obligations and protect the security of the service.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Legal basis for processing</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        In the EU, we rely on the following legal bases under the GDPR:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-600">
        <li>Performance of a contract, to provide the service you requested.</li>
        <li>Consent, when you accept our cookies and consent banner for optional tracking and personalization.</li>
        <li>Legitimate interests, for service operation, security, and fraud prevention.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Cookies and consent</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Kvelpo uses cookies to store your consent decision and to support app functionality. When you accept or reject consent, we store an <code className="rounded bg-slate-100 px-1 py-0.5">app-consent-status</code> cookie for one year. Rejecting cookies still allows access to the service with only essential cookies enabled.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Third-party services</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Kvelpo may use third-party providers to operate and secure the service, including Clerk for authentication, Stripe for payment and subscription handling, and Vercel or other hosting providers for infrastructure. These providers process data on our behalf under appropriate data protection agreements.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Your rights</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        If you are located in the EU, you have the right to:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-600">
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate or incomplete data.</li>
        <li>Request deletion of your personal data.</li>
        <li>Request restriction of processing under certain conditions.</li>
        <li>Object to processing on grounds relating to your particular situation.</li>
      </ul>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        You can manage your consent and delete your account through your profile settings in the app, or contact us using the support channels provided in the application.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Data retention</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        We retain your data only as long as needed to provide the service and comply with legal obligations. When you delete your account, we remove associated personal data from the service.
      </p>
    </main>
  );
}
