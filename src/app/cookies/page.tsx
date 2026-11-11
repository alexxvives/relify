import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";
import { CookiePreferencesLink } from "@/components/cookie-consent";
import { cookiesCopy } from "@/lib/cookies-copy";
import { pageSocialMetadata } from "@/lib/seo-head";
import { readSiteUrl } from "@/lib/env";

export function generateMetadata(): Metadata {
  return {
    title: cookiesCopy.title,
    description: cookiesCopy.description,
    ...pageSocialMetadata({
      title: cookiesCopy.title,
      description: cookiesCopy.description,
      path: "/cookies",
      origin: readSiteUrl(),
    }),
  };
}

export default function CookiesPage() {
  return (
    <PublicSite>
      <main>
        <section className="bg-gradient-to-b from-[#dceff0] to-transparent text-[#12343a]">
          <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 pb-10 sm:px-8 sm:pt-16 sm:pb-16">
            <p className="text-sm font-semibold tracking-[0.14em] text-[#2f939b] uppercase">{cookiesCopy.kicker}</p>
            <h1 className="releva-page-title mt-3 max-w-3xl text-balance">{cookiesCopy.title}</h1>
            <p className="mt-4 max-w-2xl text-pretty text-[16px] leading-7 text-[#12343a]/75 sm:text-lg">{cookiesCopy.lead}</p>
            <div className="mt-6">
              <CookiePreferencesLink className="inline-flex h-12 items-center rounded-full bg-[#12343a] px-5 text-sm font-semibold text-white" />
            </div>
          </div>
        </section>
        <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 py-12 sm:px-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-public-line bg-white p-6 shadow-public">
            <h2 className="text-xl font-semibold text-public-ink">{cookiesCopy.essentialsTitle}</h2>
            <p className="mt-3 text-[16px] leading-7 text-public-muted">{cookiesCopy.essentialsBody}</p>
          </article>
          <article className="rounded-3xl border border-public-line bg-white p-6 shadow-public">
            <h2 className="text-xl font-semibold text-public-ink">{cookiesCopy.analyticsTitle}</h2>
            <p className="mt-3 text-[16px] leading-7 text-public-muted">{cookiesCopy.analyticsBody}</p>
            <h3 className="mt-5 text-sm font-semibold tracking-[0.08em] text-public-clay uppercase">
              {cookiesCopy.gaCookiesTitle}
            </h3>
            <ul className="mt-3 grid gap-2">
              {cookiesCopy.gaCookies.map((cookie) => (
                <li key={cookie.name} className="rounded-2xl bg-public-sand px-4 py-3">
                  <p className="font-mono text-sm font-semibold text-public-ink">{cookie.name}</p>
                  <p className="mt-1 text-sm leading-6 text-public-muted">{cookie.body}</p>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-public-line bg-white p-6 shadow-public lg:col-span-2">
            <h2 className="text-xl font-semibold text-public-ink">{cookiesCopy.choiceTitle}</h2>
            <p className="mt-3 max-w-3xl text-[16px] leading-7 text-public-muted">{cookiesCopy.choiceBody}</p>
          </article>
        </section>
      </main>
    </PublicSite>
  );
}
