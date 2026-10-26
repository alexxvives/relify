"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiImageTag } from "@/components/project-photo";
import { landingCopy, offerDeals } from "@/lib/landing-copy";
import { sectorImageSrc, type SectorImageKey } from "@/lib/sector-image";

const verbs = ["vender", "comprar"] as const;
const spots = [
  {
    id: "alba",
    deal: offerDeals[0],
    sectorKey: "hosteleria" as SectorImageKey,
    lit: "/hero/city-lit.png",
    spotClass: "releva-city-spot",
    sales: [96, 214, 138, 240],
    ebitda: [12, 46, 18, 52],
    costs: [
      [72, 18, 28, 14],
      [22, 64, 16, 36],
      [48, 30, 58, 12],
      [18, 44, 20, 62],
    ],
    clients: [
      { label: "Cliente 1", share: 48 },
      { label: "Cliente 2", share: 31 },
      { label: "Cliente 3", share: 21 },
    ],
    products: [
      { label: "Producto 1", share: 44 },
      { label: "Producto 2", share: 27 },
      { label: "Servicio 1", share: 29 },
    ],
    channels: [
      { label: "Tienda", share: 52 },
      { label: "Web", share: 33 },
      { label: "Encargos", share: 15 },
    ],
    holders: [
      { label: "Accionista 1", share: 68 },
      { label: "Accionista 2", share: 32 },
    ],
  },
  {
    id: "norte",
    deal: offerDeals[1],
    sectorKey: "servicios" as SectorImageKey,
    lit: "/hero/city-2.png",
    spotClass: "releva-city-spot releva-city-spot-b",
    sales: [168, 74, 196, 112],
    ebitda: [41, 9, 38, 16],
    costs: [
      [24, 58, 14, 40],
      [66, 12, 48, 18],
      [16, 36, 70, 28],
      [42, 22, 18, 64],
    ],
    clients: [
      { label: "Cliente 1", share: 54 },
      { label: "Cliente 2", share: 28 },
      { label: "Cliente 3", share: 18 },
    ],
    products: [
      { label: "Producto 1", share: 36 },
      { label: "Producto 2", share: 22 },
      { label: "Servicio 1", share: 42 },
    ],
    channels: [
      { label: "Local", share: 61 },
      { label: "Cita online", share: 24 },
      { label: "A domicilio", share: 15 },
    ],
    holders: [
      { label: "Accionista 1", share: 74 },
      { label: "Accionista 2", share: 26 },
    ],
  },
  {
    id: "mar",
    deal: offerDeals[2],
    sectorKey: "industria" as SectorImageKey,
    lit: "/hero/city-3.png",
    spotClass: "releva-city-spot releva-city-spot-c",
    sales: [248, 126, 302, 178],
    ebitda: [58, 14, 66, 22],
    costs: [
      [30, 70, 22, 16],
      [54, 18, 62, 34],
      [14, 46, 28, 58],
      [38, 24, 16, 72],
    ],
    clients: [
      { label: "Cliente 1", share: 41 },
      { label: "Cliente 2", share: 37 },
      { label: "Cliente 3", share: 22 },
    ],
    products: [
      { label: "Producto 1", share: 51 },
      { label: "Producto 2", share: 19 },
      { label: "Servicio 1", share: 30 },
    ],
    channels: [
      { label: "Taller", share: 46 },
      { label: "Recambios", share: 34 },
      { label: "Flotas", share: 20 },
    ],
    holders: [
      { label: "Accionista 1", share: 58 },
      { label: "Accionista 2", share: 42 },
    ],
  },
] as const;

function PairBars({ sales, ebitda }: { sales: readonly number[]; ebitda: readonly number[] }) {
  const max = Math.max(...sales, ...ebitda);
  return (
    <div role="img" aria-label="Facturación y EBITDA de los últimos cuatro años">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-[#8b95a7] uppercase">Facturación y EBITDA</p>
        <p className="flex gap-2 text-xs text-[#5c6b78]">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#1aa6a0]" /> Facturación</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#e07a3d]" /> EBITDA</span>
        </p>
      </div>
      <div className="mt-1.5 flex h-14 items-end gap-2 rounded-lg bg-[#f4f7fb] px-2 pt-2">
        {sales.map((sale, index) => (
          <div key={2022 + index} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <div className="flex h-9 w-full items-end justify-center gap-0.5">
              <div className="w-2 rounded-t-sm bg-[#1aa6a0]" style={{ height: `${Math.round((sale / max) * 36)}px` }} />
              <div className="w-2 rounded-t-sm bg-[#e07a3d]" style={{ height: `${Math.round(((ebitda[index] ?? 0) / max) * 36)}px` }} />
            </div>
            <span className="text-xs text-[#8b95a7]">{2022 + index}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const costSeries = [
  { label: "Personal", color: "#465ab4" },
  { label: "Compras", color: "#e07a3d" },
  { label: "Otros", color: "#7c5cbf" },
  { label: "Amortización", color: "#0e8a78" },
] as const;

function CostBars({ years }: { years: readonly (readonly number[])[] }) {
  const labels = [2022, 2023, 2024, 2025];
  const max = Math.max(...years.flat(), 1);
  return (
    <div role="img" aria-label="Composición del gasto">
      <p className="text-xs font-medium tracking-wide text-[#8b95a7] uppercase">Composición del gasto</p>
      <div className="mt-1.5 flex h-16 items-end gap-2 rounded-lg bg-[#f4f7fb] px-2 pt-2">
        {labels.map((year, yearIndex) => (
          <div key={year} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <div className="flex h-10 w-full items-end justify-center gap-0.5">
              {costSeries.map((series, seriesIndex) => (
                <div
                  key={series.label}
                  className="w-1.5 rounded-t-sm"
                  style={{
                    height: `${Math.round((((years[yearIndex]?.[seriesIndex] ?? 0) / max) * 40))}px`,
                    background: series.color,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-[#8b95a7]">{year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniDonut({
  title,
  slices,
  colors,
}: {
  title: string;
  slices: { label: string; share: number }[];
  colors: readonly string[];
}) {
  const rings = slices.map((slice, index) => ({
    ...slice,
    offset: slices.slice(0, index).reduce((sum, item) => sum + item.share, 0),
    color: colors[index] ?? "#465ab4",
  }));
  return (
    <div role="img" aria-label={title}>
      <p className="text-xs font-medium tracking-wide text-[#8b95a7] uppercase">{title}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <svg viewBox="0 0 42 42" className="size-11 shrink-0" aria-hidden="true">
          <circle cx="21" cy="21" r="14" fill="none" stroke="#e7eaee" strokeWidth="7" />
          {rings.map((ring) => (
            <circle
              key={ring.label}
              cx="21"
              cy="21"
              r="14"
              fill="none"
              stroke={ring.color}
              strokeWidth="7"
              strokeDasharray={`${ring.share} ${100 - ring.share}`}
              strokeDashoffset={-ring.offset}
              transform="rotate(-90 21 21)"
            />
          ))}
        </svg>
        <ul className="grid gap-0.5 text-xs text-[#3d4a63]">
          {rings.map((ring) => (
            <li key={ring.label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: ring.color }} />
              {ring.label} {ring.share}%
            </li>
          ))}
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
      <span className="releva-swap-sizer" aria-hidden="true">
        comprar
      </span>
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
          <h1 id="inicio" className="releva-hero-rise releva-hero-title text-[clamp(3.1rem,6vw,5.2rem)] leading-[0.96] text-public-ink">
            <span className="block">Un mercado para</span>
            <span className="block">
              <SwapVerb /> empresas
            </span>
          </h1>
          <div className="releva-hero-actions releva-hero-rise releva-hero-rise-later pointer-events-auto flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/registro?rol=inversor"
              className="inline-flex h-12 items-center rounded-full bg-public-clay px-6 font-medium text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
            >
              {copy.cta}
            </Link>
            <Link
              href="/registro?rol=empresa"
              className="inline-flex h-12 items-center rounded-full bg-[#0c7c78] px-6 font-medium text-white transition hover:bg-[#0a5f5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c7c78]"
            >
              {copy.sellCta}
            </Link>
          </div>
        </div>
        {open ? (
          <article className="releva-market-float" aria-live="polite">
            <div className="relative aspect-[3/1] overflow-hidden rounded-xl bg-[#1c2740]">
              <Image src={sectorImageSrc(open.sectorKey)} alt="" fill sizes="320px" className="object-cover" unoptimized />
              <AiImageTag />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#0c1224]/70 via-[#0c1224]/20 to-transparent px-3 pt-3 pb-10 text-center">
                <p className="text-sm font-semibold text-white">{open.deal.codename}</p>
                <p className="text-xs text-white/85">{open.deal.region}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <PairBars sales={open.sales} ebitda={open.ebitda} />
              <CostBars years={open.costs} />
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <MiniDonut
                  title="Clientes"
                  slices={[...open.clients]}
                  colors={["#1b7a45", "#8fd0a8", "#0f4d2c"]}
                />
                <MiniDonut
                  title="Productos y servicios"
                  slices={[...open.products]}
                  colors={["#e07a3d", "#f6c7a4", "#8a4b22"]}
                />
                <MiniDonut
                  title="Canales de venta"
                  slices={[...open.channels]}
                  colors={["#1d4e89", "#3d7cc9", "#9ec3ef"]}
                />
                <MiniDonut
                  title="Accionistas"
                  slices={[...open.holders]}
                  colors={["#b42318", "#f0a3a0"]}
                />
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
