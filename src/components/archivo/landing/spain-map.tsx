"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { landingCopy, mapRegions } from "@/lib/landing-copy";

export function SpainMap() {
  const [selected, setSelected] = useState<(typeof mapRegions)[number]["id"]>("cataluna");
  const region = mapRegions.find((item) => item.id === selected) ?? mapRegions[0];

  return (
    <section id={landingCopy.map.id} className="scroll-mt-24 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-[32px] leading-[1.05] font-normal tracking-[-0.02em] text-[#2b3b4a] sm:text-[40px]">
              {landingCopy.map.heading}
            </h2>
            <p className="mt-3 text-[15px] text-[#5c6b78]">{landingCopy.map.intro}</p>
          </div>
          <Link
            href="/proyectos"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#eef1f4] px-4 text-sm text-[#2b3b4a] transition hover:bg-[#e4e8ee]"
          >
            {landingCopy.map.more}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-8 overflow-hidden rounded-[28px] bg-[#eef3f1]">
          <Image
            src="/spain-map.svg"
            alt="Mapa de España por comunidades autónomas"
            width={1287}
            height={693}
            unoptimized
            className="h-auto w-full"
          />
          <article className="absolute top-4 right-4 hidden w-[250px] lg:block">
            <RegionCard region={region} />
          </article>
          {mapRegions.map((item) => {
            const active = item.id === region.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(item.id)}
                className="absolute flex -translate-y-1/2 items-center gap-1.5"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ring-2 ring-white ${active ? "bg-[#384753]" : "bg-[#2f6f73]"}`}
                />
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap shadow-sm sm:text-xs ${active ? "bg-[#384753] text-white" : "bg-white/95 text-[#2b3b4a]"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <article className="mt-4 lg:hidden">
          <RegionCard region={region} />
        </article>
      </div>
    </section>
  );
}

function RegionCard({ region }: { region: (typeof mapRegions)[number] }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_18px_40px_-24px_rgba(43,59,74,0.5)]">
      <div className="relative h-28 overflow-hidden rounded-xl">
        <Image src={region.image} alt="" width={640} height={360} className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-white text-[#465ab4]">
          <MapPin className="size-4" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-3 text-lg font-medium text-[#2b3b4a]">{region.label}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#f4f6f8] px-2 py-1.5">
          <dt className="text-[10px] text-[#7b8792]">Facturación media</dt>
          <dd className="text-sm font-medium">{region.revenue}</dd>
        </div>
        <div className="rounded-lg bg-[#f4f6f8] px-2 py-1.5">
          <dt className="text-[10px] text-[#7b8792]">EBITDA medio</dt>
          <dd className="text-sm font-medium">{region.ebitda}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-[#7b8792]">Sectores más relevantes</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {region.sectors.map((sector) => (
          <li key={sector} className="rounded-full bg-[#f4f6f8] px-2 py-1 text-[12px] text-[#2b3b4a]">
            {sector}
          </li>
        ))}
      </ul>
    </div>
  );
}
