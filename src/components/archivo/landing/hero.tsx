"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DealCard } from "@/components/archivo/landing/deal-card";
import { heroDeals, heroDetail, landingCopy, type ShowcaseDeal } from "@/lib/landing-copy";

function RotatingWord({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const widest = words.reduce((longest, word) => (word.length > longest.length ? word : longest), words[0]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setVisible(true);
      }, 280);
    }, 2800);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <span className="inline-grid align-bottom" aria-live="polite">
      <span className="invisible col-start-1 row-start-1 font-medium" aria-hidden="true">
        {widest}
      </span>
      <span
        className={`col-start-1 row-start-1 font-medium text-[#435bb1] transition duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        {words[index]}
      </span>
    </span>
  );
}

function Reel({ deals, className }: { deals: readonly ShowcaseDeal[]; className: string }) {
  const loop = [...deals, ...deals];
  return (
    <div className={`flex w-[270px] shrink-0 flex-col gap-4 ${className}`}>
      {loop.map((deal, index) => (
        <DealCard key={`${deal.codename}-${index}`} deal={deal} />
      ))}
    </div>
  );
}

function DetailCard() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setScene((current) => (current + 1) % 3), 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="releva-float relative w-[300px]">
      <div className="relative h-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-24px_rgba(43,59,74,0.55)]">
        <div className={`absolute inset-0 p-4 transition duration-700 ${scene === 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <article>
            <p className="text-xs text-[#6d7c89]">{heroDetail.region}</p>
            <h3 className="text-lg font-medium text-[#2b3b4a]">{heroDetail.codename}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Facturación", heroDetail.revenue],
                ["EBITDA", heroDetail.ebitda],
                ["EBITDA ajustado", heroDetail.adjusted],
                ["Precio de venta", heroDetail.price],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#f4f6f8] px-2 py-1.5">
                  <dt className="text-[10px] text-[#7b8792]">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {heroDetail.goals.map((goal) => (
                <li key={goal} className="rounded-full bg-[#eef1fb] px-2 py-1 text-[11px] text-[#465ab4]">
                  {goal}
                </li>
              ))}
            </ul>
          </article>
        </div>
        <div className={`absolute inset-0 overflow-auto p-4 transition duration-700 ${scene === 1 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <article>
            <p className="text-xs text-[#6d7c89]">Balance · activo corriente</p>
            <div className="mt-3 flex h-24 items-end gap-3">
              {heroDetail.bars.map((height, index) => (
                <div key={heroDetail.years[index]} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-[#465ab4]" style={{ height: `${height}%` }} />
                  <span className="text-[10px] text-[#7b8792]">{heroDetail.years[index]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="size-16 shrink-0 rounded-full"
                style={{ background: "conic-gradient(#465ab4 0 70%, #8aa0e6 70% 90%, #d9e1f8 90% 100%)" }}
              >
                <div className="m-2 flex size-12 items-center justify-center rounded-full bg-white text-[10px] text-[#6d7c89]">3</div>
              </div>
              <ul className="space-y-1 text-[11px] text-[#2b3b4a]">
                {heroDetail.shareholders.map((holder) => (
                  <li key={holder.label} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: holder.color }} />
                    {holder.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              {heroDetail.pnl.map((year) => (
                <div key={year.year} className="rounded-lg bg-[#f4f6f8] p-2">
                  <p className="font-medium">{year.year}</p>
                  {year.rows.map(([label, value]) => (
                    <p key={label} className="mt-1 flex justify-between gap-2 text-[#5c6b78]">
                      <span>{label}</span>
                      <span className="text-[#2b3b4a]">{value}</span>
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </div>
        <div className={`absolute inset-0 p-4 transition duration-700 ${scene === 2 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <article>
            <p className="text-lg font-medium text-[#2b3b4a]">{heroDetail.investor}</p>
            <p className="text-sm text-[#6d7c89]">{heroDetail.investorCity}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3 rounded-lg bg-[#f4f6f8] px-3 py-2">
                <dt className="text-[#6d7c89]">Capital disponible</dt>
                <dd className="font-medium">{heroDetail.capital}</dd>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-[#f4f6f8] px-3 py-2">
                <dt className="text-[#6d7c89]">Adquisición deseada</dt>
                <dd className="font-medium">{heroDetail.stake}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <span className="rounded-xl border border-[#d9e0ea] px-3 py-2 text-sm">{heroDetail.sent}</span>
              <span className="rounded-xl bg-[#e8eefc] px-3 py-2 text-sm font-medium text-[#465ab4]">{heroDetail.accepted}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const offsetDeals = [...heroDeals.slice(3), ...heroDeals.slice(0, 3)];

  return (
    <section className="px-4 pt-4" aria-labelledby="inicio">
      <div className="relative isolate mx-auto overflow-hidden rounded-[20px] lg:h-[min(720px,calc(100dvh-132px))] lg:min-h-[620px] lg:max-h-[720px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_28%_22%,#dae2ff_0%,#aab3d2_45%,#8a93b3_70%,#dfa550_115%)]" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-25 mix-blend-overlay" aria-hidden="true">
          <filter id="releva-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#releva-grain)" />
        </svg>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255,255,255)_22%,rgba(255,255,255,0)_78%)]" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col gap-10 px-4 py-8 sm:px-8 lg:flex-row lg:items-stretch lg:gap-8 lg:py-10">
          <div className="flex max-w-[640px] flex-1 flex-col justify-between gap-10">
            <div className="flex flex-col gap-5">
              <h1
                id="inicio"
                className="text-[clamp(1.85rem,8vw,2.5rem)] leading-[1.02] font-normal tracking-[-0.02em] text-[#2b3b4a] sm:text-[56px] lg:text-[76px]"
              >
                Plataforma digital
                <br />
                para <RotatingWord words={landingCopy.words} />
                <br />
                empresas
              </h1>
              <p className="max-w-[460px] text-base leading-6 text-[#2b3b4a] sm:text-[17px]">{landingCopy.intro}</p>
            </div>
            <Link
              href="/registro"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#465ab4] px-6 text-[18px] text-[#f9fafb] shadow-sm transition hover:bg-[#3c4e9e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4] sm:w-fit"
            >
              {landingCopy.registerCta}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
          <div className="pointer-events-none relative hidden h-full w-[560px] shrink-0 lg:block">
            <div className="releva-mask-y absolute inset-0 flex gap-6">
              <div className="h-full overflow-hidden">
                <Reel deals={heroDeals} className="releva-reel-a" />
              </div>
              <div className="h-full overflow-hidden pt-16">
                <Reel deals={offsetDeals} className="releva-reel-b" />
              </div>
            </div>
            <div className="absolute top-16 right-0 z-10">
              <DetailCard />
            </div>
            <div className="releva-cursor absolute top-[58%] left-[22%] z-20">
              <span className="block size-[18px] rounded-full bg-[#384753] shadow-md ring-2 ring-white" />
              <span className="mt-1 inline-flex rounded-md bg-[#384753] px-1.5 py-0.5 text-[13px] font-medium text-[#f9fafb]">
                {heroDetail.cursor}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="releva-mask-x mt-4 overflow-hidden lg:hidden">
        <div className="releva-marquee flex w-max gap-4">
          {[...heroDeals, ...heroDeals].map((deal, index) => (
            <DealCard key={`${deal.codename}-m-${index}`} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}
