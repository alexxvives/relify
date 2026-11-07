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
  const isInt = process.env.INT_ENVIRONMENT === "true";

  return {
    metadataBase: siteUrl,
    title: isInt ? `[INT] ${landingCopy.title}` : landingCopy.title,
    description: landingCopy.description,
    ...(isInt && {
      robots: {
        index: false,
        follow: false,
      },
    }),
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
        {/* INT environment badge */}
        {process.env.INT_ENVIRONMENT === "true" && (
          <div className="fixed top-2 right-2 z-[100] rounded-md bg-orange-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
            INT
          </div>
        )}
      </body>
    </html>
  );
}
