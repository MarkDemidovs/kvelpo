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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-subtle bg-dark-card px-4 py-4 text-sm text-dark-primary shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="font-semibold text-dark-primary mb-1">Privacy & Cookie Consent</p>
          <p className="text-dark-secondary">
            We use cookies and process your data to provide our services and improve your experience. 
            By clicking "Accept All", you consent to our use of cookies as described in our 
            <a href="/cookies" className="text-accent-blue hover:underline">Cookie Policy</a> and 
            <a href="/privacy" className="text-accent-blue hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <form action={saveConsentAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="termsVersion" value="1" />
          <input type="hidden" name="privacyVersion" value="1" />
          <button type="submit" name="consentAction" value="accept" className="btn-primary !px-4 !py-2 text-sm">
            Accept All
          </button>
          <button type="submit" name="consentAction" value="reject" className="btn-secondary !px-4 !py-2 text-sm">
            Essential Only
          </button>
          <a href="/consent" className="btn-secondary !px-4 !py-2 text-sm">
            Manage Preferences
          </a>
        </form>
      </div>
    </div>
  );
}
