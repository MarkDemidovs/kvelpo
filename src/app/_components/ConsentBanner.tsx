import { cookies, headers } from "next/headers";
import { saveConsentAction } from "~/app/actions/consent";

const euCountries = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export default async function ConsentBanner() {
  const cookieStore = await cookies();
  const consentStatus = cookieStore.get("app-consent-status")?.value;
  const country = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const isEuResident = euCountries.has(country);
  const hasConsented = consentStatus === "accepted" || consentStatus === "rejected";

  if (!isEuResident || hasConsented) {
    return null;
  }

  return (
    <div className="border-b border-dark-subtle bg-dark-tertiary px-4 py-3 text-sm text-dark-primary">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>
          We use cookies and account data to provide this service. For EU visitors, we need your consent to continue.
        </p>
        <form action={saveConsentAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="termsVersion" value="1" />
          <input type="hidden" name="privacyVersion" value="1" />
          <button
            type="submit"
            name="consentAction"
            value="accept"
            className="rounded-lg bg-accent-blue px-3 py-2 font-semibold text-dark-primary hover:bg-blue-500"
          >
            Accept cookies
          </button>
          <button
            type="submit"
            name="consentAction"
            value="reject"
            className="rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 font-semibold text-dark-secondary hover:bg-dark-tertiary"
          >
            Reject cookies
          </button>
          <a href="/consent" className="text-sm font-medium text-accent-blue underline">
            Learn more
          </a>
        </form>
      </div>
    </div>
  );
}
