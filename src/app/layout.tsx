import type { Metadata } from "next";
import { DM_Sans, Geist, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { HashCleaner } from "@/components/hash-cleaner";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const siteUrl = readSiteUrl();

  return {
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
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Suspense fallback={null}>
          <HashCleaner />
        </Suspense>
      </body>
    </html>
  );
}
