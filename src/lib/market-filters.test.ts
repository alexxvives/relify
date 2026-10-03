import { describe, expect, it } from "vitest";
import { filterMarketProjects, type MarketFilters } from "./market-filters";
import type { PublicProjectCard } from "./public-project";

const projects: PublicProjectCard[] = [
  {
    slug: "proyecto-olivo",
    codename: "Proyecto Olivo",
    region: "Comunitat Valenciana",
    revenueCents: 125_000_000,
    ebitdaCents: 31_000_000,
    adjustedEbitdaCents: 34_000_000,
    askingPriceCents: 98_000_000,
  },
  {
    slug: "proyecto-roble",
    codename: "Proyecto Roble",
    region: "Cataluña",
    revenueCents: 210_000_000,
    ebitdaCents: 42_000_000,
    adjustedEbitdaCents: 45_000_000,
    askingPriceCents: 160_000_000,
  },
  {
    slug: "proyecto-duna",
    codename: "Proyecto Duna",
    region: "Canarias",
    revenueCents: 74_000_000,
    ebitdaCents: 11_000_000,
    adjustedEbitdaCents: 13_000_000,
    askingPriceCents: 48_000_000,
  },
];

const filters: MarketFilters = {
  query: "",
  sort: "codename",
  revenueBand: "any",
  ebitdaBand: "any",
  regions: [],
};

describe("filterMarketProjects", () => {
  it("keeps the public card and filters by region, revenue, and search", () => {
    expect(filterMarketProjects(projects, filters).map((project) => project.codename)).toEqual([
      "Proyecto Duna",
      "Proyecto Olivo",
      "Proyecto Roble",
    ]);

    expect(
      filterMarketProjects(projects, { ...filters, regions: ["Canarias"] }).map((project) => project.slug),
    ).toEqual(["proyecto-duna"]);

    expect(
      filterMarketProjects(projects, { ...filters, revenueBand: "over-2m", sort: "revenue" }).map(
        (project) => project.codename,
      ),
    ).toEqual(["Proyecto Roble"]);

    expect(filterMarketProjects(projects, { ...filters, query: "olivo" }).map((project) => project.slug)).toEqual([
      "proyecto-olivo",
    ]);

    const card = filterMarketProjects(projects, { ...filters, ebitdaBand: "200k-400k" })[0];
    expect(card?.codename).toBe("Proyecto Olivo");
    expect(card).not.toHaveProperty("legalName");
    expect(card).not.toHaveProperty("cif");
  });
});
