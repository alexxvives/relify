"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy } from "@/lib/landing-copy";

const deal = heroDeals[0];
const verbs = ["vender", "comprar"] as const;
const years = [3.1, 3.6, 4.2, 4.8] as const;

function YearBars({ values }: { values: readonly number[] }) {
  const max = Math.max(...values);
  return (
    <div className="mt-3 border-t border-[#e7eaee] pt-3" role="img" aria-label="Facturación de los últimos cuatro años">
      <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">Facturación</p>
      <div className="mt-2 flex h-16 items-end gap-2">
        {values.map((value, index) => (
          <div key={2022 + index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-sm bg-[#1c2740]" style={{ height: `${Math.round((value / max) * 40)}px` }} />
            <span className="text-[10px] text-[#8b95a7]">{2022 + index}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SwapVerb() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % verbs.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="releva-swap">
      <span key={verbs[index]} className="releva-swap-word">
        {verbs[index]}
      </span>
    </span>
  );
}

export function Hero() {
  const copy = landingCopy.home;
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="inicio" className="releva-hero releva-hero-sky" onPointerLeave={() => setOpen(false)}>
      <div className="releva-hero-glass">
        <div className="releva-city-frame" aria-hidden="true">
          <Image src="/hero/city.png" alt="" width={1536} height={1024} priority unoptimized className="h-full w-full object-cover" />
          <Image
            src="/hero/city-lit.png"
            alt=""
            width={1536}
            height={1024}
            unoptimized
            className="h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: open ? 1 : 0 }}
          />
        </div>
        <button
          type="button"
          className="releva-city-spot"
          aria-pressed={open}
          aria-label={`${deal.codename}, ${deal.region}. Ver cifras`}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") {
              setOpen(true);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen(true)}
        >
          <span className={`releva-city-pin ${open ? "releva-city-pin-on" : ""}`} aria-hidden="true" />
        </button>
        <div className="releva-hero-copy pointer-events-none">
          <p className="releva-hero-rise text-sm tracking-[0.16em] text-public-muted uppercase">Comprar o vender</p>
          <h1 id="inicio" className="releva-hero-rise releva-hero-rise-late mt-3 text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] font-medium tracking-tight text-public-ink">
            <span className="block">Un mercado para</span>
            <span className="block">
              <SwapVerb />
            </span>
            <span className="block">empresas</span>
          </h1>
          <p className="releva-hero-rise releva-hero-rise-later mt-5 max-w-xl text-lg leading-8 text-public-muted">{copy.intro}</p>
          <div className="releva-hero-rise releva-hero-rise-later pointer-events-auto mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/proyectos"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
            >
              {copy.cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/empresas/vender"
              className="inline-flex h-12 items-center rounded-full border border-white/70 bg-white/75 px-6 text-public-ink backdrop-blur-md transition hover:border-public-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
            >
              {copy.sellCta}
            </Link>
          </div>
        </div>
        {open ? (
          <article className="releva-market-float" aria-live="polite">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#1c2740]">
              <Image src={deal.image} alt="" fill sizes="280px" className="object-cover" unoptimized />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#0c1224]/70 via-[#0c1224]/20 to-transparent px-3 pt-3 pb-10 text-center">
                <p className="text-sm font-semibold text-white">{deal.codename}</p>
                <p className="text-xs text-white/85">{deal.region}</p>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#e7eaee]">
              <div className="bg-[#f4f6fb] px-3 py-2.5 text-center">
                <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">Precio</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{deal.price}</p>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-[#e7eaee]">
                {[
                  ["Facturación", deal.revenue],
                  ["EBITDA", deal.ebitda],
                  ["EBITDA ajustado", deal.adjusted],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 px-1.5 py-2.5 text-center">
                    <dt className="text-[11px] leading-4 font-medium text-[#5c6b78]">{label}</dt>
                    <dd className="mt-0.5 text-[13px] font-semibold tracking-tight text-[#1c2740] tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <YearBars values={years} />
          </article>
        ) : null}
      </div>
    </section>
  );
}
