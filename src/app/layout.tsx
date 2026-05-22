import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import TopNav from "./_components/topnav";
import ChatPopup from "./_components/ChatPopup";

export const metadata: Metadata = {
  title: "notiontab",
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
      <html lang="en" className={`${geist.variable}`}>
        <body>
          <TopNav />
          {children}
          <ChatPopup />
        </body>
      </html>
    </ClerkProvider>
  );
}
