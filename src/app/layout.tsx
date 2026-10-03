import type { Metadata } from "next";
import { DM_Sans, Geist } from "next/font/google";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-dm",
  display: "swap",
});

const siteUrl = readSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: landingCopy.title,
  description: landingCopy.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: landingCopy.title,
    description: landingCopy.description,
    url: "/",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: landingCopy.title,
    description: landingCopy.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
