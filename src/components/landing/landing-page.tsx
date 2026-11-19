import { ActivityFeed } from "@/components/landing/activity-feed";
import { Confidentiality } from "@/components/landing/confidentiality";
import { Hero } from "@/components/landing/hero";
import { Offer } from "@/components/landing/offer";
import { PathAndFlow } from "@/components/landing/path-and-flow";
import { Process } from "@/components/landing/process";
import { PublicSite } from "@/components/landing/public-site";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";
import { siteJsonLd } from "@/lib/seo-head";

export function landingJsonLd(siteUrl: URL) {
  return siteJsonLd(siteUrl, landingCopy.home.description);
}

export async function LandingPage() {
  const jsonLd = landingJsonLd(readSiteUrl());

  return (
    <PublicSite dockedCta>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <Hero />
        <Offer />
        <Process />
        <PathAndFlow />
        <Confidentiality />
        <ActivityFeed />
      </main>
    </PublicSite>
  );
}
