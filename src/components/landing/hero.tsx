"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroDeals, landingCopy, type ShowcaseDeal } from "@/lib/landing-copy";

const scene = { width: 1440, minY: 70, height: 680 };

type Block = {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  deal?: ShowcaseDeal;
  bars?: readonly number[];
};

const stone = { left: "#c5ddd9", right: "#f7fbfb", top: "#ffffff", window: "#8fbfba" };
const saleTone = { left: "#3aa39b", right: "#b7ebe6", top: "#e7faf7", window: "#0c3f42" };

const blocks: readonly Block[] = [
  { x: 180, y: 430, w: 70, d: 54, h: 120 },
  { x: 310, y: 400, w: 86, d: 60, h: 210 },
  { x: 470, y: 390, w: 64, d: 48, h: 150 },
  { x: 590, y: 360, w: 96, d: 70, h: 280 },
  { x: 760, y: 410, w: 72, d: 52, h: 160 },
  { x: 900, y: 380, w: 80, d: 58, h: 230 },
  { x: 1060, y: 420, w: 68, d: 50, h: 140 },
  { x: 1180, y: 400, w: 90, d: 64, h: 200 },
  { x: 1320, y: 450, w: 60, d: 44, h: 110 },
  { x: 250, y: 560, w: 78, d: 56, h: 170 },
  {
    x: 430,
    y: 590,
    w: 92,
    d: 66,
    h: 240,
    deal: heroDeals[0],
    bars: [42, 55, 48, 86],
  },
  { x: 640, y: 540, w: 70, d: 50, h: 130 },
  {
    x: 820,
    y: 600,
    w: 100,
    d: 72,
    h: 260,
    deal: heroDeals[5],
    bars: [38, 52, 70, 92],
  },
  { x: 1040, y: 560, w: 74, d: 54, h: 150 },
  {
    x: 1210,
    y: 610,
    w: 88,
    d: 62,
    h: 200,
    deal: heroDeals[1],
    bars: [60, 48, 74, 88],
  },
  { x: 360, y: 700, w: 64, d: 46, h: 100 },
  {
    x: 980,
    y: 690,
    w: 84,
    d: 60,
    h: 180,
    deal: heroDeals[7],
    bars: [34, 46, 63, 80],
  },
];

function face(x: number, y: number, w: number, d: number, h: number) {
  const rise = 0.42;
  const left = `${x},${y} ${x - w},${y - w * rise} ${x - w},${y - w * rise - h} ${x},${y - h}`;
  const right = `${x},${y} ${x + d},${y - d * rise} ${x + d},${y - d * rise - h} ${x},${y - h}`;
  const top = `${x},${y - h} ${x - w},${y - h - w * rise} ${x - w + d},${y - h - w * rise - d * rise} ${x + d},${y - h - d * rise}`;
  return { left, right, top };
}

function windows(x: number, y: number, w: number, d: number, h: number, fill: string) {
  const rise = 0.42;
  const marks: { x: number; y: number; width: number; height: number }[] = [];
  const rows = Math.max(2, Math.floor(h / 36));
  for (let row = 1; row < rows; row += 1) {
    const yLeft = y - w * rise - (h / rows) * row;
    marks.push({ x: x - w * 0.62, y: yLeft, width: w * 0.28, height: 8 });
    const yRight = y - d * rise - (h / rows) * row;
    marks.push({ x: x + d * 0.28, y: yRight, width: d * 0.28, height: 8 });
  }
  return marks.map((mark) => <rect key={`${mark.x}-${mark.y}`} x={mark.x} y={mark.y} width={mark.width} height={mark.height} fill={fill} rx="1" />);
}

function CityBlock({ block }: { block: Block }) {
  const tone = block.deal ? saleTone : stone;
  const shape = face(block.x, block.y, block.w, block.d, block.h);
  return (
    <g>
      <polygon points={shape.left} fill={tone.left} />
      <polygon points={shape.right} fill={tone.right} />
      <polygon points={shape.top} fill={tone.top} />
      {windows(block.x, block.y, block.w, block.d, block.h, tone.window)}
    </g>
  );
}

function MetricChart({ bars }: { bars: readonly number[] }) {
  const years = ["2022", "2023", "2024", "2025"];
  return (
    <svg viewBox="0 0 220 78" className="mt-3 h-16 w-full" role="img" aria-label="Facturación de los últimos cuatro años">
      {bars.map((value, index) => {
        const height = (value / 100) * 52;
        const x = 18 + index * 52;
        return (
          <g key={years[index]}>
            <rect x={x} y={58 - height} width="22" height={height} rx="4" fill={index === bars.length - 1 ? "#0f6e73" : "#b7e4df"} />
            <text x={x + 11} y="74" textAnchor="middle" fill="#5d7374" fontSize="10">
              {years[index]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BuildingPin({ block, open, onOpen, onClose }: { block: Block; open: boolean; onOpen: () => void; onClose: () => void }) {
  if (!block.deal || !block.bars) {
    return null;
  }
  const deal = block.deal;
  const left = (block.x / scene.width) * 100;
  const top = ((block.y - block.h - scene.minY) / scene.height) * 100;
  const placeLeft = left > 68;

  return (
    <div
      className="absolute z-20"
      style={{ left: `${left}%`, top: `${top}%` }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          onOpen();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          onClose();
        }
      }}
    >
      <button
        type="button"
        className={`releva-city-pin ${open ? "releva-city-pin-on" : ""}`}
        aria-expanded={open}
        aria-label={`${deal.codename}, ${deal.region}. Ver cifras`}
        onClick={() => {
          if (window.matchMedia("(hover: hover)").matches) {
            onOpen();
            return;
          }
          if (open) {
            onClose();
          } else {
            onOpen();
          }
        }}
        onFocus={onOpen}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.parentElement?.contains(next)) {
            onClose();
          }
        }}
      >
        <span className="sr-only">{deal.price}</span>
      </button>
      {open ? (
        <article className={`releva-city-card ${placeLeft ? "releva-city-card-left" : ""}`}>
          <p className="text-xs text-public-muted">
            {deal.region} · {deal.sector}
          </p>
          <h2 className="text-lg font-medium tracking-tight text-public-ink">{deal.codename}</h2>
          <MetricChart bars={block.bars} />
          <dl className="mt-2 grid grid-cols-3 gap-2">
            {[
              ["Facturación", deal.revenue],
              ["EBITDA", deal.ebitda],
              ["Precio", deal.price],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] tracking-wide text-public-muted uppercase">{label}</dt>
                <dd className="text-sm font-medium text-public-clay">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ) : null}
    </div>
  );
}

export function Hero() {
  const copy = landingCopy.home;
  const [openId, setOpenId] = useState<string | null>(null);

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
      <div className="releva-city">
        <svg viewBox={`0 ${scene.minY} ${scene.width} ${scene.height}`} className="h-auto w-full" aria-hidden="true">
          <ellipse cx="720" cy="700" rx="620" ry="46" fill="#d7eeeb" />
          {blocks.map((block) => (
            <CityBlock key={`${block.x}-${block.y}`} block={block} />
          ))}
        </svg>
        {blocks.map((block) => (
          <BuildingPin
            key={`${block.x}-${block.y}-pin`}
            block={block}
            open={openId === `${block.x}-${block.y}`}
            onOpen={() => setOpenId(`${block.x}-${block.y}`)}
            onClose={() => setOpenId(null)}
          />
        ))}
      </div>
    </section>
  );
}
