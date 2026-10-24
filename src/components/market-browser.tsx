"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { MarketCardFigures } from "@/components/market-card-figures";
import { ProjectPhoto } from "@/components/project-photo";
import { FilterSelect } from "@/components/ui/filter-select";
import { HeartIcon } from "@/components/ui/heart";
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
import { formatCardEur, formatWholeEur } from "@/lib/money";
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
  heading,
  onlyFavorites = false,
}: {
  projects: PublicProjectCard[];
  favoriteSlugs: string[];
  heading?: string;
  onlyFavorites?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MarketSort>("recommended");
  const [revenueBand, setRevenueBand] = useState<RevenueBandId>("any");
  const [ebitdaBand, setEbitdaBand] = useState<EbitdaBandId>("any");
  const [regions, setRegions] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState(favoriteSlugs);

  function rememberFavorite(slug: string, favorited: boolean) {
    setSavedSlugs((current) => {
      if (favorited) {
        return current.includes(slug) ? current : [...current, slug];
      }
      return current.filter((item) => item !== slug);
    });
  }

  const regionOptions = useMemo(
    () => [...new Set(projects.map((project) => project.region))].sort((left, right) => left.localeCompare(right, "es")),
    [projects],
  );

  const source = onlyFavorites ? projects.filter((project) => savedSlugs.includes(project.slug)) : projects;
  const matched = filterMarketProjects(source, { query, sort, revenueBand, ebitdaBand, regions });
  const visible = favoritesOnly ? matched.filter((project) => savedSlugs.includes(project.slug)) : matched;
  const regionValue = regions[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {heading ? <h1 className="text-3xl tracking-tight text-public-ink sm:justify-self-start">{heading}</h1> : <span />}
        <button
          type="button"
          role="switch"
          aria-checked={favoritesOnly}
          onClick={() => {
            setFavoritesOnly((current) => !current);
          }}
          className="inline-flex items-center justify-self-center gap-3"
        >
          <HeartIcon size={16} className={favoritesOnly ? "text-[#c23b4a]" : "text-[#8b95a7]"} aria-hidden />
          <span className="text-sm font-medium text-[#1c2740]">{marketCopy.favoritesOnly}</span>
          <span className={favoritesOnly ? "relative h-7 w-12 rounded-full bg-[#465ab4]" : "relative h-7 w-12 rounded-full bg-[#d5dbe3]"}>
            <span
              className={
                favoritesOnly
                  ? "absolute top-0.5 left-5 size-6 rounded-full bg-white shadow-sm"
                  : "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm"
              }
            />
          </span>
        </button>
      </div>
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
      {visible.length === 0 ? (
        <p className="text-sm text-[#5c6b78]">{favoritesOnly ? marketCopy.favoritesEmpty : marketCopy.empty}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => {
            return (
              <article key={project.slug} className="relative overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton
                    slug={project.slug}
                    favorited={savedSlugs.includes(project.slug)}
                    onChange={(favorited) => {
                      rememberFavorite(project.slug, favorited);
                    }}
                  />
                </div>
                <Link href={`/proyectos/${project.slug}`} className="flex h-full flex-col">
                  <ProjectPhoto
                    slug={project.slug}
                    src={project.coverSrc}
                    sectorKey={project.sectorKey}
                    verified={project.verified}
                    alt={`Ilustración de ${project.codename}`}
                    title={project.codename}
                    place={project.region}
                  />
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <MarketCardFigures
                      revenue={formatCardEur(project.revenueCents)}
                      ebitda={formatCardEur(project.ebitdaCents)}
                      adjustedEbitda={formatCardEur(project.adjustedEbitdaCents)}
                      askingPrice={formatWholeEur(project.askingPriceCents)}
                      askingPriceCents={project.askingPriceCents}
                      ebitdaCents={project.ebitdaCents}
                    />
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
