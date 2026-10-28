import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SandboxBanner } from "@/components/SiteChrome";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Always render with live data (traps and carts can change at any moment).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Sandbox Market", template: "%s · Sandbox Market" },
  description: "A fictional test marketplace for AI shopping agents. No real payments.",
  // Keep every page out of search engines.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SandboxBanner />
        {children}
      </body>
    </html>
  );
}
