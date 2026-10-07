"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { landingCopy, offerDeals, specimenMetrics, type ShowcaseDeal } from "@/lib/landing-copy";

export function Offer() {
  const copy = landingCopy.home.offer;
  const [active, setActive] = useState("Proyecto Olivo");
  const selected = offerDeals.find((deal) => deal.codename === active) ?? offerDeals[0];

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h2 id={`${copy.id}-titulo`} className="text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
              {copy.heading}
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-public-muted">{copy.intro}</p>
          </div>
          <Link href="/proyectos" className="inline-flex items-center gap-2 text-sm text-public-clay hover:text-public-clay-deep">
            {copy.catalog}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {selected ? (
          <div className="mt-8">
            <Stage deal={selected} />
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {offerDeals.map((deal) => {
                const pressed = deal.codename === selected.codename;
                return (
                  <li key={deal.codename}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => setActive(deal.codename)}
                      className={`relative h-28 w-full overflow-hidden rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay sm:h-32 ${pressed ? "ring-2 ring-public-clay ring-offset-2 ring-offset-public-paper" : "opacity-80 hover:opacity-100"}`}
                    >
                      <Image src={deal.image} alt="" fill className="object-cover" sizes="180px" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-public-ink/80 to-transparent px-2.5 pt-6 pb-2 text-xs text-white">
                        {deal.region}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stage({ deal }: { deal: ShowcaseDeal }) {
  return (
    <div className="grid overflow-hidden rounded-[2rem] bg-public-ink text-white lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]">
      <div className="relative min-h-[280px] sm:min-h-[380px]">
        <Image src={deal.image} alt="" fill className="object-cover" sizes="(min-width: 1024px) 60vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-public-ink/50 to-transparent lg:bg-gradient-to-r" />
      </div>
      <div aria-live="polite" className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
        <div>
          <p className="text-sm text-white/70">{deal.region}</p>
          <h3 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">{deal.codename}</h3>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
          {specimenMetrics.map((metric) => (
            <div key={metric.key}>
              <dt className="text-[11px] tracking-wide text-white/60 uppercase">{metric.label}</dt>
              <dd className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">{deal[metric.key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
