import { ActivityFeed } from "@/components/archivo/landing/activity-feed";
import { Audiences } from "@/components/archivo/landing/audiences";
import { Cases } from "@/components/archivo/landing/cases";
import { Closing } from "@/components/archivo/landing/closing";
import { Confidentiality } from "@/components/archivo/landing/confidentiality";
import { Hero } from "@/components/archivo/landing/hero";
import { LandingFooter } from "@/components/archivo/landing/landing-footer";
import { LandingHeader } from "@/components/archivo/landing/landing-header";
import { SpainMap } from "@/components/archivo/landing/spain-map";
import { StatsBar } from "@/components/archivo/landing/stats-bar";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";

export async function LandingPage() {
  const siteUrl = readSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Relify",
    url: new URL("/", siteUrl).href,
    description: landingCopy.description,
    inLanguage: "es",
  };

  return (
    <div className="min-h-full overflow-x-clip bg-white text-[#2b3b4a]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />
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
