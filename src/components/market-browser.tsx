"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { SellerTabs } from "@/components/seller-tabs";
import { FilterSelect } from "@/components/ui/filter-select";
import { marketCopy } from "@/lib/market-copy";
import {
  ebitdaBandIds,
  filterMarketProjects,
  marketSorts,
  revenueBandIds,
  type EbitdaBandId,
  type MarketSort,
  type RevenueBandId,
} from "@/lib/market-filters";
import { formatEur } from "@/lib/money";
import { projectImageSrc } from "@/lib/project-image";
import type { PublicProjectCard } from "@/lib/public-project";

const fieldClassName =
  "h-11 w-full rounded-xl border border-[#e1e6ee] bg-white px-3 text-sm text-[#1c2740] outline-none focus-visible:border-[#5c4de0] focus-visible:ring-3 focus-visible:ring-[#5c4de0]/25";

function isMarketSort(value: string): value is MarketSort {
  return marketSorts.some((sort) => sort === value);
}

function isRevenueBand(value: string): value is RevenueBandId {
  return revenueBandIds.some((band) => band === value);
}

function isEbitdaBand(value: string): value is EbitdaBandId {
  return ebitdaBandIds.some((band) => band === value);
}

export function MarketBrowser({
  projects,
  favoriteSlugs,
}: {
  projects: PublicProjectCard[];
  favoriteSlugs: string[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MarketSort>("codename");
  const [revenueBand, setRevenueBand] = useState<RevenueBandId>("any");
  const [ebitdaBand, setEbitdaBand] = useState<EbitdaBandId>("any");
  const [regions, setRegions] = useState<string[]>([]);
  const [tab, setTab] = useState<"picks" | "all">("picks");

  const regionOptions = useMemo(
    () => [...new Set(projects.map((project) => project.region))].sort((left, right) => left.localeCompare(right, "es")),
    [projects],
  );

  const visible = filterMarketProjects(projects, { query, sort, revenueBand, ebitdaBand, regions });
  const regionValue = regions[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <SellerTabs
        label={marketCopy.title}
        tabs={[
          { id: "picks", label: "Recomendaciones" },
          { id: "all", label: "Todas las empresas" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "all" ? (
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.8fr))] lg:items-end">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {marketCopy.searchLabel}
            <input
              type="search"
              value={query}
              placeholder={marketCopy.searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              className={fieldClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {marketCopy.regionLabel}
            <FilterSelect
              label={marketCopy.regionLabel}
              value={regionValue}
              options={[
                { value: "", label: marketCopy.regionAll },
                ...regionOptions.map((region) => ({ value: region, label: region })),
              ]}
              onValueChange={(next) => {
                setRegions(next.length > 0 ? [next] : []);
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {marketCopy.revenueLabel}
            <FilterSelect
              label={marketCopy.revenueLabel}
              value={revenueBand}
              options={revenueBandIds.map((option) => ({ value: option, label: marketCopy.revenueBands[option] }))}
              onValueChange={(next) => {
                if (isRevenueBand(next)) {
                  setRevenueBand(next);
                }
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {marketCopy.ebitdaLabel}
            <FilterSelect
              label={marketCopy.ebitdaLabel}
              value={ebitdaBand}
              options={ebitdaBandIds.map((option) => ({ value: option, label: marketCopy.ebitdaBands[option] }))}
              onValueChange={(next) => {
                if (isEbitdaBand(next)) {
                  setEbitdaBand(next);
                }
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {marketCopy.sortLabel}
            <FilterSelect
              label={marketCopy.sortLabel}
              value={sort}
              options={marketSorts.map((option) => ({ value: option, label: marketCopy.sorts[option] }))}
              onValueChange={(next) => {
                if (isMarketSort(next)) {
                  setSort(next);
                }
              }}
            />
          </label>
        </div>
      </div>
      ) : (
        <section className="rounded-2xl bg-[#f4f6fb] p-5">
          <h2 className="text-xl font-semibold text-[#2b3b4a]">Según tu actividad</h2>
        </section>
      )}
      {visible.length === 0 ? (
        <p className="text-sm text-[#5c6b78]">{marketCopy.empty}</p>
      ) : (
        <div className={tab === "picks" ? "-mt-2 flex gap-4 overflow-x-auto pb-2" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"}>
          {visible.map((project) => {
            const imageSrc = projectImageSrc(project.slug);

            return (
              <article key={project.slug} className={tab === "picks" ? "relative w-[280px] shrink-0 overflow-hidden rounded-2xl border border-[#e7eaee] bg-white" : "relative overflow-hidden rounded-2xl border border-[#e7eaee] bg-white"}>
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton slug={project.slug} favorited={favoriteSlugs.includes(project.slug)} />
                </div>
                <Link href={`/proyectos/${project.slug}`} className="flex h-full flex-col">
                  {imageSrc ? (
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={imageSrc}
                        alt={`Ilustración de ${project.codename}`}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">{project.codename}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#5c6b78]">
                        <MapPin className="size-3.5" aria-hidden />
                        {project.region}
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-3">
                      {marketCopy.metrics.map((metric) => (
                        <div key={metric.key} className="rounded-xl bg-[#f5f6fa] px-3 py-2">
                          <dt className="text-xs text-[#8b95a7]">{metric.label}</dt>
                          <dd className="mt-1 text-sm font-medium">{formatEur(project[metric.key])}</dd>
                        </div>
                      ))}
                    </dl>
                    <span className="mt-auto inline-flex h-11 items-center justify-center rounded-xl border border-[#e1e6ee] text-sm font-medium">
                      {marketCopy.details}
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
