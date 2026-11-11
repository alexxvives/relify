import type { Metadata } from "next";
import { Clock, LineChart, ShieldCheck } from "lucide-react";
import { ValuationRequestForm } from "@/components/valuation-request-form";
import { PublicSite } from "@/components/public-site";
import { valuationCopy } from "@/lib/valuation-request";
import { getCurrentUser } from "@/server/getCurrentUser";
import { readSiteUrl } from "@/lib/env";

const title = valuationCopy.title;
const description = valuationCopy.description;

export function generateMetadata(): Metadata {
  const canonical = new URL("/valorar", readSiteUrl()).href;
  return {
    title,
    description,
    alternates: { canonical: "/valorar" },
    openGraph: {
      title: valuationCopy.ogTitle,
      description,
      url: canonical,
      locale: "es_ES",
      type: "website",
      siteName: "Relify",
    },
    twitter: {
      card: "summary_large_image",
      title: valuationCopy.ogTitle,
      description,
    },
  };
}

const asideIcons = [LineChart, Clock, ShieldCheck];

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
            <aside className="flex flex-col gap-5" aria-label={valuationCopy.asideTitle}>
              <div className="releva-valorar-paper">
                <p className="releva-valorar-mark">Relify</p>
                <span className="releva-valorar-rule" aria-hidden />
                <h2 className="text-lg font-semibold text-public-ink">{valuationCopy.asideTitle}</h2>
                <ul className="releva-valorar-range mt-4">
                  <li>
                    Conservador
                    <b aria-hidden />
                  </li>
                  <li>
                    Base
                    <b aria-hidden />
                  </li>
                  <li>
                    Alto
                    <b aria-hidden />
                  </li>
                </ul>
                <span className="releva-valorar-stamp">Sin cargo</span>
              </div>
              <ul className="flex flex-col gap-4 rounded-3xl border border-public-line bg-white p-5 sm:p-6">
                {valuationCopy.aside.map((item, index) => {
                  const Icon = asideIcons[index] ?? LineChart;
                  return (
                    <li key={item.title} className="flex gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f4] text-[#0f6b62]">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block font-semibold text-public-ink">{item.title}</span>
                        <span className="mt-0.5 block text-sm leading-6 text-public-muted">{item.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>

          <section className="releva-valorar-faq" aria-labelledby="valorar-faq">
            <h2 id="valorar-faq">{valuationCopy.faqTitle}</h2>
            {valuationCopy.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        </div>
      </main>
    </PublicSite>
  );
}
