"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy, type ShowcaseDeal } from "@/lib/landing-copy";

type Tower = {
  id: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  deal?: ShowcaseDeal;
  bars?: readonly number[];
};

const towers: readonly Tower[] = [
  { id: "a", x: 210, y: 470, w: 78, d: 58, h: 150 },
  { id: "b", x: 340, y: 430, w: 92, d: 66, h: 250 },
  { id: "c", x: 500, y: 450, w: 70, d: 50, h: 170 },
  {
    id: "alba",
    x: 640,
    y: 500,
    w: 108,
    d: 78,
    h: 300,
    deal: heroDeals[0],
    bars: [3.1, 3.6, 4.2, 4.8],
  },
  { id: "d", x: 820, y: 440, w: 74, d: 54, h: 190 },
  {
    id: "lumen",
    x: 980,
    y: 520,
    w: 116,
    d: 82,
    h: 280,
    deal: heroDeals[5],
    bars: [5.4, 6.6, 7.8, 8.9],
  },
  { id: "e", x: 1160, y: 460, w: 80, d: 56, h: 160 },
  {
    id: "norte",
    x: 430,
    y: 620,
    w: 100,
    d: 72,
    h: 210,
    deal: heroDeals[1],
    bars: [7.2, 8.4, 9.8, 11.4],
  },
  { id: "f", x: 760, y: 640, w: 68, d: 48, h: 120 },
  {
    id: "delta",
    x: 1080,
    y: 650,
    w: 104,
    d: 74,
    h: 230,
    deal: heroDeals[7],
    bars: [14, 16.8, 19.1, 21.5],
  },
];

function shape(tower: Tower) {
  const rise = 0.46;
  const { x, y, w, d, h } = tower;
  const left = `${x},${y} ${x - w},${y - w * rise} ${x - w},${y - w * rise - h} ${x},${y - h}`;
  const right = `${x},${y} ${x + d},${y - d * rise} ${x + d},${y - d * rise - h} ${x},${y - h}`;
  const top = `${x},${y - h} ${x - w},${y - h - w * rise} ${x - w + d},${y - h - (w + d) * rise} ${x + d},${y - h - d * rise}`;
  return { left, right, top };
}

function slots(tower: Tower, side: "left" | "right") {
  const rise = 0.46;
  const { x, y, w, d, h } = tower;
  const rows = Math.max(3, Math.floor(h / 34));
  const marks = [];
  for (let row = 1; row < rows; row += 1) {
    if (side === "left") {
      const yy = y - w * rise - (h / rows) * row;
      marks.push(`${x - w * 0.72},${yy} ${x - w * 0.28},${yy + w * 0.12}`);
    } else {
      const yy = y - d * rise - (h / rows) * row;
      marks.push(`${x + d * 0.22},${yy} ${x + d * 0.68},${yy - d * 0.1}`);
    }
  }
  return marks;
}

function CityTower({ tower, lit, onOpen }: { tower: Tower; lit: boolean; onOpen: () => void }) {
  const faces = shape(tower);
  const sale = Boolean(tower.deal);
  return (
    <g
      className={lit ? "releva-tower-lit" : undefined}
      onPointerEnter={(event) => {
        if (sale && event.pointerType === "mouse") {
          onOpen();
        }
      }}
    >
      <polygon points={faces.left} fill={sale ? "url(#sale-left)" : "url(#clay-left)"} />
      <polygon points={faces.right} fill={sale ? "url(#sale-right)" : "url(#clay-right)"} />
      <polygon points={faces.top} fill={sale ? "url(#sale-top)" : "url(#clay-top)"} />
      {slots(tower, "left").map((points) => (
        <polyline key={`l-${points}`} points={points} fill="none" stroke={sale ? "#0c4c4e" : "#9ec4c0"} strokeWidth="5" strokeLinecap="round" />
      ))}
      {slots(tower, "right").map((points) => (
        <polyline key={`r-${points}`} points={points} fill="none" stroke={sale ? "#147a74" : "#d5e8e6"} strokeWidth="5" strokeLinecap="round" />
      ))}
      <polygon className="releva-tower-shine" points={faces.right} fill="url(#shine)" />
      {sale ? (
        <polygon
          points={`${faces.top} ${faces.left} ${faces.right}`}
          fill="transparent"
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          aria-pressed={lit}
          aria-label={`${tower.deal?.codename}, ${tower.deal?.region}. Ver cifras`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
        />
      ) : null}
    </g>
  );
}

function DealChart({ bars }: { bars: readonly number[] }) {
  const max = Math.max(...bars);
  const width = 200;
  const height = 150;
  const step = width / (bars.length - 1);
  const points = bars.map((value, index) => {
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
  const [openId, setOpenId] = useState("lumen");
  const open = towers.find((tower) => tower.id === openId && tower.deal) ?? towers.find((tower) => tower.deal);
  const deal = open?.deal;
  const bars = open?.bars;

  return (
    <section aria-labelledby="inicio" className="releva-hero releva-hero-city">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-2 text-center">
        <p className="releva-hero-rise text-sm tracking-[0.16em] text-public-muted uppercase">Comprar o vender</p>
        <h1 id="inicio" className="releva-hero-rise releva-hero-rise-late mt-3 max-w-[16ch] text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] font-medium tracking-tight text-public-ink">
          {copy.title}
        </h1>
        <p className="releva-hero-rise releva-hero-rise-later mt-5 max-w-xl text-lg leading-8 text-public-muted">{copy.intro}</p>
        <div className="releva-hero-rise releva-hero-rise-later mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/proyectos"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/empresas/vender"
            className="inline-flex h-12 items-center rounded-full border border-public-line bg-white px-6 text-public-ink transition hover:border-public-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.sellCta}
          </Link>
        </div>
      </div>
      <div className="releva-city-row">
        <div className="releva-city">
          <svg viewBox="0 80 1320 640" className="h-auto w-full" role="img" aria-label="Ciudad de empresas. Los bloques en verde están en venta.">
            <defs>
              <linearGradient id="clay-left" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d7e8e6" />
                <stop offset="1" stopColor="#f4fbfa" />
              </linearGradient>
              <linearGradient id="clay-right" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#e7f4f2" />
              </linearGradient>
              <linearGradient id="clay-top" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#f7fbfb" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="sale-left" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0f6e73" />
                <stop offset="1" stopColor="#7ed0cb" />
              </linearGradient>
              <linearGradient id="sale-right" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d9f7f3" />
                <stop offset="1" stopColor="#8fd9d2" />
              </linearGradient>
              <linearGradient id="sale-top" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#b7ebe6" />
                <stop offset="1" stopColor="#f3fffd" />
              </linearGradient>
              <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.05" />
                <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.72" />
                <stop offset="1" stopColor="#fff4d8" stopOpacity="0.15" />
              </linearGradient>
              <filter id="tower-shadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="18" stdDeviation="10" floodColor="#12343a" floodOpacity="0.16" />
              </filter>
            </defs>
            <ellipse cx="660" cy="690" rx="520" ry="28" fill="#d5ebe8" />
            <g filter="url(#tower-shadow)">
              {towers.map((tower) => (
                <CityTower key={tower.id} tower={tower} lit={tower.id === openId} onOpen={() => setOpenId(tower.id)} />
              ))}
            </g>
          </svg>
        </div>
        {deal && bars ? (
          <article className="releva-slab" aria-live="polite">
            <p className="text-xs tracking-[0.14em] text-white/80 uppercase">En venta</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">{deal.codename}</h2>
            <p className="mt-1 text-sm text-white/80">
              {deal.region} · {deal.sector}
            </p>
            <div className="releva-slab-body">
              <p className="text-[11px] tracking-[0.14em] text-public-muted uppercase">Facturación</p>
              <DealChart bars={bars} />
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
      </div>
    </section>
  );
}
