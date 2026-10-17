"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy } from "@/lib/landing-copy";

const verbs = ["vender", "comprar"] as const;
const spots = [
  { id: "alba", deal: heroDeals[0], lit: "/hero/city-lit.png", spotClass: "releva-city-spot", sales: [3.1, 3.6, 4.2, 4.8], ebitda: [0.7, 0.82, 0.96, 1.1] },
  { id: "norte", deal: heroDeals[1], lit: "/hero/city-2.png", spotClass: "releva-city-spot releva-city-spot-b", sales: [8.4, 9.2, 10.4, 11.4], ebitda: [1.6, 1.9, 2.1, 2.4] },
] as const;

function PairBars({ sales, ebitda }: { sales: readonly number[]; ebitda: readonly number[] }) {
  const max = Math.max(...sales, ...ebitda);
  return (
    <div className="mt-3" role="img" aria-label="Facturación y EBITDA de los últimos cuatro años">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">Facturación y EBITDA</p>
        <p className="flex gap-2 text-[10px] text-[#5c6b78]">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#1aa6a0]" /> Facturación</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#e07a3d]" /> EBITDA</span>
        </p>
      </div>
      <div className="mt-2 flex h-24 items-end gap-3 rounded-xl bg-[#f4f7fb] px-3 pt-3">
        {sales.map((sale, index) => (
          <div key={2022 + index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end justify-center gap-1">
              <div className="w-2.5 rounded-t-sm bg-[#1aa6a0]" style={{ height: `${Math.round((sale / max) * 64)}px` }} />
              <div className="w-2.5 rounded-t-sm bg-[#e07a3d]" style={{ height: `${Math.round(((ebitda[index] ?? 0) / max) * 64)}px` }} />
            </div>
            <span className="text-[10px] text-[#8b95a7]">{2022 + index}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MixDonut() {
  return (
    <div className="mt-3" role="img" aria-label="Composición del gasto">
      <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">Composición del gasto</p>
      <div className="mt-2 flex items-center gap-3">
        <svg viewBox="0 0 42 42" className="size-16 shrink-0" aria-hidden="true">
          <circle cx="21" cy="21" r="14" fill="none" stroke="#e7eaee" strokeWidth="7" />
          <circle cx="21" cy="21" r="14" fill="none" stroke="#1aa6a0" strokeWidth="7" strokeDasharray="40 88" strokeDashoffset="0" transform="rotate(-90 21 21)" />
          <circle cx="21" cy="21" r="14" fill="none" stroke="#e07a3d" strokeWidth="7" strokeDasharray="26 88" strokeDashoffset="-40" transform="rotate(-90 21 21)" />
          <circle cx="21" cy="21" r="14" fill="none" stroke="#3d5a80" strokeWidth="7" strokeDasharray="22 88" strokeDashoffset="-66" transform="rotate(-90 21 21)" />
        </svg>
        <ul className="grid gap-1 text-[11px] text-[#3d4a63]">
          <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1aa6a0]" /> Personal 46%</li>
          <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#e07a3d]" /> Compras 29%</li>
          <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#3d5a80]" /> Otros 25%</li>
        </ul>
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
  const [openId, setOpenId] = useState<string | null>(null);
  const open = spots.find((spot) => spot.id === openId) ?? null;

  return (
    <section aria-labelledby="inicio" className="releva-hero releva-hero-sky">
      <div className="releva-hero-glass">
        <div className="releva-city-frame" aria-hidden="true">
          <Image src="/hero/city.png" alt="" width={1536} height={1024} priority unoptimized className="h-full w-full object-cover" />
          {spots.map((spot) => (
            <Image
              key={spot.id}
              src={spot.lit}
              alt=""
              width={1536}
              height={1024}
              unoptimized
              className="h-full w-full object-cover transition-opacity duration-300"
              style={{ opacity: openId === spot.id ? 1 : 0 }}
            />
          ))}
        </div>
        {spots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={spot.spotClass}
            aria-pressed={openId === spot.id}
            aria-label={`${spot.deal.codename}, ${spot.deal.region}. Ver cifras`}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") {
                setOpenId(spot.id);
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") {
                setOpenId((current) => (current === spot.id ? null : current));
              }
            }}
            onFocus={() => setOpenId(spot.id)}
            onBlur={() => setOpenId((current) => (current === spot.id ? null : current))}
          >
            <span className="releva-price-bubble" aria-hidden="true">
              {spot.deal.price}
            </span>
          </button>
        ))}
        <div className="releva-hero-copy pointer-events-none">
          <h1 id="inicio" className="releva-hero-rise text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.02] font-medium tracking-tight text-public-ink">
            <span className="block">Un mercado para</span>
            <span className="block">
              <SwapVerb /> empresas
            </span>
          </h1>
          <div className="releva-hero-rise releva-hero-rise-later pointer-events-auto mt-5 flex flex-wrap items-center justify-center gap-3">
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
              <Image src={open.deal.image} alt="" fill sizes="320px" className="object-cover" unoptimized />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#0c1224]/70 via-[#0c1224]/20 to-transparent px-3 pt-3 pb-10 text-center">
                <p className="text-sm font-semibold text-white">{open.deal.codename}</p>
                <p className="text-xs text-white/85">{open.deal.region}</p>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#e7eaee]">
              <div className="bg-[#f4f6fb] px-3 py-2.5 text-center">
                <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">Precio</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{open.deal.price}</p>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-[#e7eaee]">
                {[
                  ["Facturación", open.deal.revenue],
                  ["EBITDA", open.deal.ebitda],
                  ["EBITDA ajustado", open.deal.adjusted],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 px-1.5 py-2.5 text-center">
                    <dt className="text-[11px] leading-4 font-medium text-[#5c6b78]">{label}</dt>
                    <dd className="mt-0.5 text-[13px] font-semibold tracking-tight text-[#1c2740] tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <PairBars sales={open.sales} ebitda={open.ebitda} />
            <MixDonut />
          </article>
        ) : null}
      </div>
    </section>
  );
}
