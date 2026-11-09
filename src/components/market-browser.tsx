"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pagination, usePageParam } from "@/components/pagination";
import { ArrowUpDown, Check } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { MarketCard, marketGridClass } from "@/components/market-card";
import { FilterSelect } from "@/components/ui/filter-select";
import { HeartIcon } from "@/components/ui/heart";
import { marketCopy } from "@/lib/market-copy";
import {
  filterMarketProjects,
  marketSorts,
  revenueBandIds,
  type MarketSort,
  type RevenueBandId,
} from "@/lib/market-filters";
import type { PublicProjectCard } from "@/lib/public-project";
import { Input } from "@/components/ui/form";


function isMarketSort(value: string): value is MarketSort {
  return marketSorts.some((sort) => sort === value);
}

function isRevenueBand(value: string): value is RevenueBandId {
  return revenueBandIds.some((band) => band === value);
}


const MARKET_PAGE_SIZE = 12;

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
  const [regions, setRegions] = useState<string[]>([]);
  const [sector, setSector] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const matched = filterMarketProjects(source, { query, sort, revenueBand, regions, sector });
  const sectorOptions = [...new Map(projects.flatMap((project) => (project.sector && project.sectorLabel ? [[project.sector, project.sectorLabel] as const] : []))).entries()].sort(
    (left, right) => left[1].localeCompare(right[1], "es"),
  );
  const shown = favoritesOnly ? matched.filter((project) => savedSlugs.includes(project.slug)) : matched;
  const paging = usePageParam(shown.length, MARKET_PAGE_SIZE, JSON.stringify([query, sort, revenueBand, regions, sector, favoritesOnly]));
  const visible = shown.slice(paging.start, paging.end);
  const regionValue = regions[0] ?? "";
  
  const activeFilterCount = [
    revenueBand !== "any",
    regions.length > 0,
    sector !== "",
    sort !== "recommended",
  ].filter(Boolean).length;
  
  function clearFilters() {
    setRevenueBand("any");
    setRegions([]);
    setSector("");
    setSort("recommended");
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        {heading ? <h1 className="text-2xl sm:text-3xl tracking-tight text-public-ink sm:justify-self-start">{heading}</h1> : <span />}
        <button
          type="button"
          role="switch"
          aria-checked={favoritesOnly}
          onClick={() => {
            setFavoritesOnly((current) => !current);
          }}
          className="inline-flex items-center justify-center sm:justify-self-center gap-2 sm:gap-3 min-h-[44px] shrink-0"
        >
          <HeartIcon size={16} className={favoritesOnly ? "text-[#c23b4a]" : "text-[#8b95a7]"} aria-hidden />
          <span className="text-sm font-medium text-[#1c2740]">{marketCopy.favoritesOnly}</span>
          <span className={favoritesOnly ? "relative h-7 w-12 shrink-0 rounded-full bg-[#465ab4]" : "relative h-7 w-12 shrink-0 rounded-full bg-[#d5dbe3]"}>
            <span
              className={
                favoritesOnly
                  ? "absolute top-0.5 left-5 size-6 rounded-full bg-white shadow-sm transition-transform"
                  : "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform"
              }
            />
          </span>
        </button>
      </div>
      {/* t92: the filter bar stacks above the cards so its open dropdowns cover the cards' heart buttons (z-20). */}
      <div className="relative z-40 rounded-xl sm:rounded-2xl border border-[#e7eaee] bg-white p-3 sm:p-4">
        {/* Mobile compact filter UI */}
        <div className="sm:hidden">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
              {marketCopy.searchLabel}
              <Input
                type="search"
                value={query}
                placeholder={marketCopy.searchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="mt-auto min-h-[44px] flex items-center gap-2 rounded-lg border border-[#d5dbe3] bg-white px-3 py-2 text-sm font-medium text-[#1c2740] hover:bg-[#f8f9fa] active:bg-[#e7eaee]"
              aria-expanded={filtersOpen}
              aria-controls="mobile-filters"
            >
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#465ab4] px-1.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          {filtersOpen && (
            <div id="mobile-filters" className="mt-3 flex flex-col gap-3 border-t border-[#e7eaee] pt-3">
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
                Sector
                <FilterSelect
                  label="Sector"
                  value={sector}
                  options={[{ value: "", label: "Todos los sectores" }, ...sectorOptions.map(([value, label]) => ({ value, label: sentence(label) }))]}
                  onValueChange={setSector}
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
              <div className="flex items-center justify-between">
                <SortMenu value={sort} onChange={setSort} />
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-[#465ab4] hover:text-[#3648a3] font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Desktop full filter toolbar */}
        <div className="hidden sm:grid grid-cols-1 items-end gap-2.5 sm:gap-3 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto]">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78] sm:col-span-3 xl:col-span-1">
            {marketCopy.searchLabel}
            <Input
              type="search"
              value={query}
              placeholder={marketCopy.searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
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
            Sector
            <FilterSelect
              label="Sector"
              value={sector}
              options={[{ value: "", label: "Todos los sectores" }, ...sectorOptions.map(([value, label]) => ({ value, label: sentence(label) }))]}
              onValueChange={setSector}
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
          <SortMenu value={sort} onChange={setSort} />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-[#5c6b78]">{favoritesOnly ? marketCopy.favoritesEmpty : marketCopy.empty}</p>
      ) : (
        <div className={`isolate ${marketGridClass}`}>
          {visible.map((project) => {
            return (
              <MarketCard
                key={project.slug}
                project={project}
                actions={
                  <>
                    <FavoriteButton
                      slug={project.slug}
                      favorited={savedSlugs.includes(project.slug)}
                      onChange={(favorited) => {
                        rememberFavorite(project.slug, favorited);
                      }}
                    />
                  </>
                }
              />
            );
          })}
        </div>
      )}
      <Pagination page={paging.page} pages={paging.pages} onChange={paging.setPage} />
    </div>
  );
}

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function SortMenu({ value, onChange }: { value: MarketSort; onChange: (next: MarketSort) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${marketCopy.sortLabel}: ${marketCopy.sorts[value]}`}
        title={`${marketCopy.sortLabel}: ${marketCopy.sorts[value]}`}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className={`relative inline-flex size-11 items-center justify-center rounded-xl border bg-white text-[#1c2740] transition-colors duration-150 outline-none hover:bg-[#f4f6fb] focus-visible:ring-3 focus-visible:ring-[#5c4de0]/25 ${open ? "border-[#5c4de0]" : "border-[#e1e6ee]"}`}
      >
        <ArrowUpDown className="size-5" aria-hidden />
        {value !== "recommended" ? <span className="absolute top-2 right-2 size-2 rounded-full bg-[#465ab4]" aria-hidden /> : null}
      </button>
      {open ? (
        <div role="menu" aria-label={marketCopy.sortLabel} className="absolute top-full right-0 z-30 mt-2 w-60 rounded-xl border border-[#e7eaee] bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(28,39,64,0.45)]">
          <p className="px-3 pt-1.5 pb-1 text-xs font-medium text-[#667085]">{marketCopy.sortLabel} por</p>
          {marketSorts.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === value}
              onClick={() => {
                if (isMarketSort(option)) {
                  onChange(option);
                }
                setOpen(false);
              }}
              className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm outline-none hover:bg-[#f4f6fb] focus-visible:bg-[#f4f6fb] ${option === value ? "font-semibold text-[#33429a]" : "text-[#1c2740]"}`}
            >
              {marketCopy.sorts[option]}
              {option === value ? <Check className="size-4" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
