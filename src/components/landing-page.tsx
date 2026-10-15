import { Hero } from "@/components/landing/hero";
import { Offer } from "@/components/landing/offer";
import { PathAndFlow } from "@/components/landing/path-and-flow";
import { Process } from "@/components/landing/process";
import { ProcessRelief } from "@/components/landing/process-relief";
import { PublicSite } from "@/components/public-site";
import { readSiteUrl } from "@/lib/env";
import { landingCopy } from "@/lib/landing-copy";

export async function LandingPage() {
  const siteUrl = readSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Releva",
    url: new URL("/", siteUrl).href,
    description: landingCopy.home.description,
    inLanguage: "es",
  };

  return (
    <PublicSite>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <Hero />
        <Offer />
        <Process />
        <ProcessRelief />
        <PathAndFlow />
      </main>
    </PublicSite>
  );
}
