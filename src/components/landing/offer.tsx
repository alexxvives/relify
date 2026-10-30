"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { landingCopy, offerDeals, specimenMetrics, type ShowcaseDeal } from "@/lib/landing-copy";

/** "110K €" → 110. The showcase figures share one unit, so the ratio needs no scaling. */
function thousands(value: string): number {
  return Number.parseFloat(value.replace(/[^\d,.]/g, "").replace(",", "."));
}

function multipleOf(deal: ShowcaseDeal): string {
  const ratio = thousands(deal.price) / thousands(deal.ebitda);
  return Number.isFinite(ratio) ? ratio.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "—";
}

const sectorName = (sector: string) => sector.charAt(0).toUpperCase() + sector.slice(1);

/** A deal board: the list reads like a market screen, the card beside it opens the selected listing. */
export function Offer() {
  const copy = landingCopy.home.offer;
  const [active, setActive] = useState("Proyecto Sur");
  const selected = offerDeals.find((deal) => deal.codename === active) ?? offerDeals[0];

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="mx-auto w-full max-w-[1440px] rounded-[2rem] bg-public-ink p-5 text-white sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="flex min-w-0 flex-col">
            <p className="text-sm tracking-[0.16em] text-[#7fd6cc] uppercase">{copy.kicker}</p>
            <h2 id={`${copy.id}-titulo`} className="mt-3 text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
              {copy.heading}
            </h2>
            <p className="mt-4 max-w-[34rem] text-[16px] leading-7 text-white/70">{copy.intro}</p>

            <div className="mt-8 flex items-center justify-between border-b border-white/15 pb-3 text-xs tracking-[0.12em] text-white/55 uppercase">
              <span>{copy.boardLabel}</span>
              <span className="hidden sm:inline">{copy.multipleLabel}</span>
            </div>
            <ul className="divide-y divide-white/10">
              {offerDeals.map((deal) => {
                const pressed = deal.codename === selected?.codename;
                return (
                  <li key={deal.codename}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => setActive(deal.codename)}
                      onMouseEnter={() => setActive(deal.codename)}
                      className={`group grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd6cc] sm:grid-cols-[2.75rem_minmax(0,1fr)_auto_4.5rem] ${pressed ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <span className="relative size-11 overflow-hidden rounded-lg">
                        <Image src={deal.image} alt="" fill className="object-cover" sizes="44px" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium">{deal.codename}</span>
                        <span className="block truncate text-xs text-white/60">
                          {deal.region} · {sectorName(deal.sector)}
                        </span>
                      </span>
                      <span className="text-right text-[15px] font-medium tabular-nums">{deal.price}</span>
                      <span
                        className={`hidden justify-self-end rounded-full px-2.5 py-1 text-xs font-medium tabular-nums sm:inline-flex ${pressed ? "bg-[#7fd6cc] text-public-ink" : "bg-white/10 text-white/80"}`}
                      >
                        ×{multipleOf(deal)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected ? <Listing deal={selected} catalog={copy.openCard} multipleLabel={copy.multipleLabel} /> : null}
        </div>
      </div>
    </section>
  );
}

function Listing({ deal, catalog, multipleLabel }: { deal: ShowcaseDeal; catalog: string; multipleLabel: string }) {
  return (
    <article aria-live="polite" className="flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-white text-public-ink lg:sticky lg:top-28 lg:self-start">
      <div className="relative aspect-[16/10] w-full">
        <Image key={deal.image} src={deal.image} alt="" fill className="releva-offer-photo object-cover" sizes="(min-width: 1024px) 640px, 100vw" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-public-ink/85 to-transparent px-5 pt-16 pb-4 text-white">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="size-3.5" aria-hidden="true" />
              {deal.region}
            </p>
            <h3 className="mt-1 truncate text-3xl font-medium tracking-tight sm:text-4xl">{deal.codename}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-public-ink">{sectorName(deal.sector)}</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-public-line sm:grid-cols-4">
        {specimenMetrics.map((metric) => (
          <div key={metric.key} className="bg-white px-5 py-4">
            <dt className="text-[11px] tracking-wide whitespace-nowrap text-public-muted uppercase">{metric.label}</dt>
            <dd className="mt-1 text-xl font-medium tracking-tight tabular-nums">{deal[metric.key]}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-public-muted">
          {multipleLabel}: <span className="font-medium text-public-ink tabular-nums">×{multipleOf(deal)}</span>
        </p>
        <Link
          href="/proyectos"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-public-clay px-4 text-sm font-medium text-white hover:bg-public-clay-deep"
        >
          {catalog}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
