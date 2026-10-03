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
    <section id={landingCopy.map.id} className="scroll-mt-28 px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">{landingCopy.map.heading}</h2>
            <p className="mt-4 text-[16px] leading-7 text-public-muted">{landingCopy.map.intro}</p>
          </div>
          <Link
            href="/proyectos"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-public-clay px-5 text-sm text-white transition hover:bg-public-clay-deep"
          >
            {landingCopy.map.more}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-10 rounded-[2rem] bg-public-card p-3 shadow-public sm:p-5">
          <Image
            src="/spain-map.svg"
            alt="Mapa de España por comunidades autónomas"
            width={1287}
            height={693}
            unoptimized
            className="h-auto w-full"
          />
          <article className="absolute top-6 right-6 hidden w-[250px] lg:block">
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
                className="absolute z-10 flex -translate-y-1/2 items-center gap-1.5"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
              >
                <span className={`size-2.5 shrink-0 rounded-full ${active ? "bg-public-clay" : "bg-public-ink"}`} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap sm:text-xs ${active ? "bg-public-ink text-white" : "bg-public-card text-public-ink shadow-sm"}`}
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
    <div className="overflow-hidden rounded-3xl bg-public-sand shadow-sm">
      <div className="relative h-28 overflow-hidden">
        <Image src={region.image} alt="" width={640} height={360} className="h-full w-full object-cover" />
        <span className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-public-card text-public-clay">
          <MapPin className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium">{region.label}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[10px] tracking-wide text-public-muted uppercase">Facturación media</dt>
            <dd className="text-sm font-medium text-public-clay">{region.revenue}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-public-muted uppercase">EBITDA medio</dt>
            <dd className="text-sm font-medium text-public-clay">{region.ebitda}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] tracking-wide text-public-muted uppercase">Sectores más relevantes</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {region.sectors.map((sector) => (
            <li key={sector} className="rounded-full bg-public-card px-2.5 py-1 text-[12px]">
              {sector}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
