import { auth } from "@clerk/nextjs/server";
import { saveConsentAction } from "~/app/actions/consent";

export default async function ConsentPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold">EU privacy consent</h1>
      <p className="mt-4 text-sm text-slate-600">
        We use your account and project metadata for the service you requested. You can accept cookies to continue using the app, or reject them and still browse with minimal tracking.
      </p>
      <form
        action={saveConsentAction}
        className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="termsVersion" value="1" />
        <input type="hidden" name="privacyVersion" value="1" />
        <p className="text-sm text-slate-600">
          Signed in as {userId ?? "guest"}.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="consentAction"
            value="accept"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Accept cookies
          </button>
          <button
            type="submit"
            name="consentAction"
            value="reject"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reject cookies
          </button>
        </div>
      </form>
    </main>
  );
}
