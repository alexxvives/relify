"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy } from "@/lib/landing-copy";

const deal = heroDeals[0];
const verbs = ["vender", "comprar"] as const;

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
      <span key={verbs[index]} className="releva-swap-word releva-word">
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
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-16 text-center pointer-events-none sm:pt-24">
          <p className="releva-hero-rise text-sm tracking-[0.16em] text-public-muted uppercase">Comprar o vender</p>
          <h1 id="inicio" className="releva-hero-rise releva-hero-rise-late mt-3 text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] font-medium tracking-tight text-public-ink">
            <span className="block">Plataforma digital</span>
            <span className="block">
              para <SwapVerb />
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
            <p className="text-center text-sm font-medium text-public-ink">{deal.codename}</p>
            <p className="mt-0.5 text-center text-xs text-public-muted">
              {deal.region} · {deal.sector}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-public-line bg-white">
              <div className="bg-[#f4f6fb] px-3 py-3 text-center">
                <p className="text-xs font-medium tracking-wide text-[#8b95a7] uppercase">Precio</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{deal.price}</p>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-[#e7eaee]">
                {[
                  ["Facturación", deal.revenue],
                  ["EBITDA", deal.ebitda],
                  ["EBITDA ajustado", deal.adjusted],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 px-2 py-3 text-center">
                    <dt className="text-[13px] leading-4 font-medium text-[#5c6b78]">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold tracking-tight text-[#1c2740] tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
