import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import TopNav from "./_components/topnav";
import { siteDescription, siteName, siteTagline, siteUrl } from "~/lib/site";
import ConsentBanner from "./_components/ConsentBanner";
import TermsGate from "./_components/TermsGate";
import { ThemeProvider, themeInitScript } from "./_components/ThemeProvider";
import { InboxProvider } from "./_components/InboxContext";
import BottomTabBar from "./_components/BottomTabBar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName}: ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    url: siteUrl,
    title: `${siteName}: ${siteTagline}`,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName}: ${siteTagline}`,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the tab bar pad for the iPhone home indicator (env(safe-area-inset-bottom)).
  viewportFit: "cover",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning className={`${geist.variable} dark`}>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body suppressHydrationWarning>
          <ThemeProvider>
          <InboxProvider>
            <TopNav />
            <ConsentBanner />
            <TermsGate />
            <main className="pt-14">
              {children}
            </main>
            <footer className="border-t border-dark-subtle bg-dark-primary px-4 py-8 text-sm text-fg-secondary sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                <p>© 2026 kvelpo</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Link href="/support" className="hover:text-fg">Help &amp; support</Link>
                  <Link href="/privacy" className="hover:text-fg">Privacy</Link>
                  <Link href="/terms" className="hover:text-fg">Terms</Link>
                  <Link href="/cookies" className="hover:text-fg">Cookies</Link>
                  <Link href="/consent" className="hover:text-fg">Consent</Link>
                </div>
              </div>
            </footer>
            <BottomTabBar />
          </InboxProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
