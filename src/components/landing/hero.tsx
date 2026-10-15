"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy } from "@/lib/landing-copy";

const deal = heroDeals[0];
const bars = [3.1, 3.6, 4.2, 4.8] as const;

function DealChart({ values }: { values: readonly number[] }) {
  const max = Math.max(...values);
  const width = 200;
  const height = 150;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 16) - 8;
    return { x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height + 22}`} className="mt-4 h-44 w-full" role="img" aria-label="Facturación de los últimos cuatro años">
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e07a3d" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#1aa6a0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1aa6a0" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chart-fill)" />
      <polyline points={line} fill="none" stroke="#0f6e73" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <g key={point.x}>
          <circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#e07a3d" strokeWidth="2.5" />
          <text x={point.x} y={height + 16} textAnchor="middle" fill="#5d7374" fontSize="11">
            {2022 + index}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Hero() {
  const copy = landingCopy.home;
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="inicio" className="releva-hero releva-hero-sky" onPointerLeave={() => setOpen(false)}>
      <div className="releva-city-frame" aria-hidden="true">
        <Image src="/hero/city.png" alt="" width={1536} height={1024} priority className="h-full w-full object-fill" />
        <Image src="/hero/city-teal.png" alt="" width={1536} height={1024} className={`releva-city-teal h-full w-full object-fill ${open ? "releva-city-teal-on" : ""}`} />
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
      />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-2 text-center pointer-events-none">
        <p className="releva-hero-rise text-sm tracking-[0.16em] text-public-muted uppercase">Comprar o vender</p>
        <h1 id="inicio" className="releva-hero-rise releva-hero-rise-late mt-3 max-w-[16ch] text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] font-medium tracking-tight text-public-ink">
          {copy.title}
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
            className="inline-flex h-12 items-center rounded-full border border-public-line bg-white/80 px-6 text-public-ink transition hover:border-public-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.sellCta}
          </Link>
        </div>
      </div>
      {open ? (
        <article className="releva-slab" aria-live="polite">
          <p className="text-xs tracking-[0.14em] text-white/80 uppercase">En venta</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">{deal.codename}</h2>
          <p className="mt-1 text-sm text-white/80">
            {deal.region} · {deal.sector}
          </p>
          <div className="releva-slab-body">
            <p className="text-[11px] tracking-[0.14em] text-public-muted uppercase">Facturación</p>
            <DealChart values={bars} />
            <dl className="mt-4 grid gap-3">
              {[
                ["Facturación", deal.revenue],
                ["EBITDA", deal.ebitda],
                ["Precio", deal.price],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-t border-public-line pt-2">
                  <dt className="text-xs tracking-wide text-public-muted uppercase">{label}</dt>
                  <dd className="text-lg font-medium text-public-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      ) : null}
    </section>
  );
}
