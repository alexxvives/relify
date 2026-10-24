import { recoveryYears } from "./money";
import type { PublicProjectCard } from "@/lib/public-project";

export const marketSorts = ["recommended", "revenue", "price"] as const;

export type MarketSort = (typeof marketSorts)[number];

export const revenueBandIds = ["any", "under-1m", "1m-2m", "over-2m"] as const;

export type RevenueBandId = (typeof revenueBandIds)[number];

export const ebitdaBandIds = ["any", "under-200k", "200k-400k", "over-400k"] as const;

export type EbitdaBandId = (typeof ebitdaBandIds)[number];

export type MarketFilters = {
  query: string;
  sort: MarketSort;
  revenueBand: RevenueBandId;
  ebitdaBand: EbitdaBandId;
  regions: string[];
  /** valuation-multiples sector id; empty = any. */
  sector?: string;
  /** HeadcountRange id; empty = any. */
  headcount?: string;
};

/** "1998" → "los 90", "2004" → "2000". Coarse on purpose (anonymity before the NDA). */
export function foundedDecade(year: number | null | undefined): string | null {
  if (!year || year < 1800) {
    return null;
  }

  const decade = Math.floor(year / 10) * 10;
  return decade >= 2000 ? String(decade) : `los ${String(decade).slice(2)}`;
}

const revenueBounds: Record<Exclude<RevenueBandId, "any">, { min: number; max: number }> = {
  "under-1m": { min: 0, max: 100_000_000 },
  "1m-2m": { min: 100_000_000, max: 200_000_000 },
  "over-2m": { min: 200_000_000, max: Number.POSITIVE_INFINITY },
};

const ebitdaBounds: Record<Exclude<EbitdaBandId, "any">, { min: number; max: number }> = {
  "under-200k": { min: 0, max: 20_000_000 },
  "200k-400k": { min: 20_000_000, max: 40_000_000 },
  "over-400k": { min: 40_000_000, max: Number.POSITIVE_INFINITY },
};

function inBand(cents: number, band: { min: number; max: number }): boolean {
  return cents >= band.min && cents < band.max;
}

export function filterMarketProjects(
  projects: PublicProjectCard[],
  filters: MarketFilters,
): PublicProjectCard[] {
  const query = filters.query.trim().toLowerCase();
  const regions = new Set(filters.regions);

  const matched = projects.filter((project) => {
    if (query.length > 0) {
      const haystack = `${project.codename} ${project.region} ${project.sectorLabel ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (regions.size > 0 && !regions.has(project.region)) {
      return false;
    }

    if (filters.sector && project.sector !== filters.sector) {
      return false;
    }

    if (filters.headcount && project.headcount !== filters.headcount) {
      return false;
    }

    if (filters.revenueBand !== "any" && !inBand(project.revenueCents, revenueBounds[filters.revenueBand])) {
      return false;
    }

    if (filters.ebitdaBand !== "any" && !inBand(project.ebitdaCents, ebitdaBounds[filters.ebitdaBand])) {
      return false;
    }

    return true;
  });

  return matched.sort((left, right) => {
    if (filters.sort === "revenue") {
      return right.revenueCents - left.revenueCents;
    }

    if (filters.sort === "price") {
      return right.askingPriceCents - left.askingPriceCents;
    }

    return comparePayback(left, right);
  });
}

function comparePayback(left: PublicProjectCard, right: PublicProjectCard): number {
  const leftYears = recoveryYears(left.askingPriceCents, left.ebitdaCents);
  const rightYears = recoveryYears(right.askingPriceCents, right.ebitdaCents);

  if (leftYears === null && rightYears === null) {
    return left.codename.localeCompare(right.codename, "es");
  }

  if (leftYears === null) {
    return 1;
  }

  if (rightYears === null) {
    return -1;
  }

  if (leftYears !== rightYears) {
    return leftYears - rightYears;
  }

  return left.codename.localeCompare(right.codename, "es");
}
