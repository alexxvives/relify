import { ActivityFeed } from "@/components/landing/activity-feed";
import { Confidentiality } from "@/components/landing/confidentiality";
import { Hero } from "@/components/landing/hero";
import { LandingAurora } from "@/components/landing/landing-aurora";
import { LandingCifras } from "@/components/landing/landing-cifras";
import { landingJsonLd } from "@/components/landing/landing-page";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Offer } from "@/components/landing/offer";
import { PathAndFlow } from "@/components/landing/path-and-flow";
import { Process } from "@/components/landing/process";
import { PublicSite } from "@/components/landing/public-site";
import { readSiteUrl } from "@/lib/env";

/** Compare on INT at `/?v=2`. Default `/` stays the current landing. */
export async function LandingPageV2() {
  const jsonLd = landingJsonLd(readSiteUrl());

  return (
    <PublicSite dockedCta>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative">
        <LandingAurora />
        <Hero wash />
        <LandingCifras />
        <LandingReveal>
          <Offer />
        </LandingReveal>
        <LandingReveal>
          <Process />
        </LandingReveal>
        <LandingReveal>
          <PathAndFlow />
        </LandingReveal>
        <LandingReveal>
          <Confidentiality />
        </LandingReveal>
        <LandingReveal>
          <ActivityFeed />
        </LandingReveal>
      </main>
    </PublicSite>
  );
}
