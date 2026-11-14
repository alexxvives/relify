import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { OfferGlare } from "@/components/landing/offer-glare";
import { MarketCard } from "@/components/investor/market-card";
import { landingCopy, offerDeals } from "@/lib/landing-copy";
import { landingPreviewHref, showcaseToProjectCard } from "@/lib/showcase-card";

/* First row: 1 / 2 / 3 / 4 cards by breakpoint. Literal classes so Tailwind sees them. */
const firstRow = ["", "hidden sm:block", "hidden lg:block", "hidden 2xl:block"] as const;

const previewCards = offerDeals.map((deal, index) => showcaseToProjectCard(deal, index));

const waitlistCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-relify-btn px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(28,39,64,0.7)] transition-colors hover:bg-relify-btn-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c2740]";

/** A sneak peek of the marketplace: the live MarketCard, then the rest locked behind the waitlist. */
export function Offer() {
  const copy = landingCopy.home.offer;
  const visible = previewCards.slice(0, firstRow.length);
  const locked = previewCards.slice(firstRow.length);

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 pt-8 pb-6 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[1.5rem] border border-[#dde7ea] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7f8_100%)] p-4 text-[#1c2740] shadow-[0_30px_80px_-50px_rgba(28,39,64,0.45)] sm:rounded-[2rem] sm:p-8 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(47,196,178,0.16),transparent_65%)]" />
        <p className="absolute top-4 right-4 hidden items-center gap-2 rounded-full border border-[#cfe6e3] bg-white px-3 py-1.5 text-xs font-medium tracking-wide text-[#3d4a63] shadow-sm sm:top-8 sm:right-8 sm:inline-flex lg:top-12 lg:right-12">
          <span className="relative flex size-2">
            <span className="absolute hidden size-full animate-ping rounded-full bg-[#2fc4b2] opacity-60 motion-reduce:animate-none sm:inline-flex" />
            <span className="relative inline-flex size-2 rounded-full bg-[#0f766e]" />
          </span>
          {copy.preview}
        </p>
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#0f766e] uppercase">{copy.kicker}</p>
          <h2 id={`${copy.id}-titulo`} className="releva-section-title mt-2 sm:mt-3">
            {copy.heading}
          </h2>
          <p className="mt-3 hidden text-[16px] leading-7 text-[#3d4a63] sm:mt-4 sm:block">{copy.intro}</p>
        </div>

        <div className="mt-6 sm:hidden">
          <Link href={copy.waitlistHref} className={`${waitlistCta} w-full`}>
            {copy.lockedCta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="relative mt-10 hidden grid-cols-1 gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((project, index) => (
            <li key={project.slug} className={`releva-peek-reveal ${firstRow[index]}`} style={{ ["--i" as string]: index }}>
              <OfferGlare>
                <MarketCard project={project} href={landingPreviewHref} />
              </OfferGlare>
            </li>
          ))}
        </ul>

        <div className="relative mt-5 -mx-5 hidden sm:-mx-8 sm:block lg:-mx-12">
          <div aria-hidden className="releva-peek-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul className="releva-peek-track flex w-max gap-5 px-5 blur-[3px] sm:px-8 lg:px-12">
              {[...locked, ...locked].map((project, index) => (
                <li key={`${project.slug}-${index}`} className="w-[17.5rem] shrink-0 sm:w-[20rem]">
                  <MarketCard project={project} href={landingPreviewHref} muted />
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f7f8]/30 via-[#f3f7f8]/85 to-[#f3f7f8] px-4 pt-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-sm ring-1 ring-[#cfe6e3]">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 max-w-md text-2xl font-medium tracking-tight sm:text-3xl">{copy.lockedTitle}</h3>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-[#3d4a63]">{copy.lockedBody}</p>
            <Link href={copy.waitlistHref} className={`${waitlistCta} mt-5`}>
              {copy.lockedCta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
