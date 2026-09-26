import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import TopNav from "./_components/topnav";
import { siteDescription, siteName, siteTagline, siteUrl } from "~/lib/site";
import ChatPopup from "./_components/ChatPopup";
import ConsentBanner from "./_components/ConsentBanner";
import { ChatProvider } from "./_components/ChatContext";

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

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning className={`${geist.variable}`}>
        <body suppressHydrationWarning>
          <ChatProvider>
            <TopNav />
            <ConsentBanner />
            <main className="pt-16">
              {children}
            </main>
            <footer className="border-t border-dark-subtle bg-dark-tertiary px-6 py-6 text-sm text-dark-secondary">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                <p>© 2026 kvelpo</p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/terms" className="hover:text-dark-primary">Terms</Link>
                  <Link href="/privacy" className="hover:text-dark-primary">Privacy</Link>
                  <Link href="/cookies" className="hover:text-dark-primary">Cookies</Link>
                  <Link href="/consent" className="hover:text-dark-primary">Consent</Link>
                </div>
              </div>
            </footer>
            <ChatPopup />
          </ChatProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
