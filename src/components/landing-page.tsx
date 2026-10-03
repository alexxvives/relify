import { ActivityFeed } from "@/components/landing/activity-feed";
import { Audiences } from "@/components/landing/audiences";
import { Cases } from "@/components/landing/cases";
import { Closing } from "@/components/landing/closing";
import { Confidentiality } from "@/components/landing/confidentiality";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { SpainMap } from "@/components/landing/spain-map";
import { StatsBar } from "@/components/landing/stats-bar";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";

export async function LandingPage() {
  const siteUrl = readSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Releva",
    url: new URL("/", siteUrl).href,
    description: landingCopy.description,
    inLanguage: "es",
  };

  return (
    <div className="min-h-full overflow-x-clip bg-public-paper font-public text-public-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader archive />
      <main>
        <Hero />
        <StatsBar />
        <SpainMap />
        <Audiences />
        <Confidentiality />
        <ActivityFeed />
        <Cases />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
