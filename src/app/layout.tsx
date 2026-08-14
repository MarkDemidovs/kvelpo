import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import TopNav from "./_components/topnav";
import ChatPopup from "./_components/ChatPopup";
import ConsentBanner from "./_components/ConsentBanner";

export const metadata: Metadata = {
  title: "kvelpo",
  description: "Created by Mark Demidovs",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${geist.variable}`}>
        <body suppressHydrationWarning>
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
                <Link href="/consent" className="hover:text-dark-primary">Consent</Link>
              </div>
            </div>
          </footer>
          <ChatPopup />
        </body>
      </html>
    </ClerkProvider>
  );
}
