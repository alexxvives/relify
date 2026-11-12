import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { CookieConsent } from "@/components/cookie-consent";
import { HashCleaner } from "@/components/hash-cleaner";
import {
  gaConsentBootstrapScript,
  gtmInstallScript,
  gtmNoscriptSrc,
  readGaMeasurementId,
  readGtmContainerId,
} from "@/lib/cookie-consent";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";
import { OG_IMAGE_ALT, OG_IMAGE_PATH, intPrefixedTitle, ogImageUrl, pageSocialMetadata, rootIcons } from "@/lib/seo-head";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateMetadata(): Metadata {
  const siteUrl = readSiteUrl();
  const isInt = process.env.INT_ENVIRONMENT === "true";

  return {
    metadataBase: siteUrl,
    title: intPrefixedTitle(isInt, landingCopy.title),
    description: landingCopy.description,
    icons: rootIcons(),
    ...(isInt && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    ...pageSocialMetadata({
      title: landingCopy.title,
      description: landingCopy.description,
      path: "/",
      origin: siteUrl,
    }),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const siteUrl = readSiteUrl();
  const int = process.env.INT_ENVIRONMENT === "true";
  const gtmId = int ? null : readGtmContainerId();
  const gaId = int ? null : readGaMeasurementId();
  const analyticsReady = Boolean(gtmId || gaId);
  const og = ogImageUrl(siteUrl);

  return (
    <html lang="es" className={`${geistSans.variable} ${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta property="og:image" content={og} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={OG_IMAGE_ALT} />
        <meta name="twitter:image" content={og} />
        <link rel="preload" as="image" href={OG_IMAGE_PATH} />
        {analyticsReady ? (
          <script dangerouslySetInnerHTML={{ __html: gaConsentBootstrapScript() }} />
        ) : null}
        {gtmId ? <script dangerouslySetInnerHTML={{ __html: gtmInstallScript(gtmId) }} /> : null}
      </head>
      <body className="min-h-full bg-background text-foreground">
        {gtmId ? (
          <noscript>
            <iframe
              src={gtmNoscriptSrc(gtmId)}
              height={0}
              width={0}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        {children}
        <CookieConsent gtmId={gtmId} gaId={gaId} />
        <Suspense fallback={null}>
          <HashCleaner />
        </Suspense>
        {process.env.INT_ENVIRONMENT === "true" && (
          <div className="fixed top-2 right-2 z-[100] rounded-md bg-orange-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
            INT
          </div>
        )}
      </body>
    </html>
  );
}
