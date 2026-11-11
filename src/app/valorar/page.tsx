import type { Metadata } from "next";
import { ValuationRequestForm } from "@/components/valuation-request-form";
import { ValuationPreview } from "@/components/valuation-preview";
import { PublicSite } from "@/components/public-site";
import { valuationCopy } from "@/lib/valuation-request";
import { getCurrentUser } from "@/server/getCurrentUser";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

const title = valuationCopy.title;
const description = valuationCopy.description;

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    ...pageSocialMetadata({
      title: valuationCopy.ogTitle,
      description,
      path: "/valorar",
      origin: readSiteUrl(),
    }),
  };
}

export default async function ValuationPage() {
  const user = await getCurrentUser();
  const account = user
    ? { name: user.displayName, email: user.email, phone: user.phone }
    : null;
  const siteUrl = readSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Valoración de empresas",
      serviceType: "Valoración de pymes",
      provider: { "@type": "Organization", name: "Relify", url: new URL("/", siteUrl).href },
      areaServed: "ES",
      url: new URL("/valorar", siteUrl).href,
      description: valuationCopy.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: valuationCopy.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <PublicSite>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="releva-valorar">
        <div className="releva-valorar-inner">
          <p className="releva-valorar-kicker">{valuationCopy.kicker}</p>
          <h1 className="releva-valorar-title">{valuationCopy.heading}</h1>
          <p className="releva-valorar-lead hidden sm:block">{valuationCopy.body}</p>
          <p className="releva-valorar-lead sm:hidden">{valuationCopy.bodyShort}</p>

          <div className="releva-valorar-grid">
            <section className="releva-valorar-form" aria-labelledby="valorar-formulario">
              <h2 id="valorar-formulario">{valuationCopy.formTitle}</h2>
              <ValuationRequestForm account={account} />
            </section>
            <ValuationPreview />
          </div>

          <section className="releva-valorar-faq" aria-labelledby="valorar-faq">
            <h2 id="valorar-faq">{valuationCopy.faqTitle}</h2>
            <div className="releva-valorar-faq-list">
              {valuationCopy.faq.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PublicSite>
  );
}
