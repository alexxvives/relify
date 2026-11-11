import { describe, expect, it } from "vitest";
import { offerDeals } from "./landing-copy";
import { showcaseToProjectCard } from "./showcase-card";

describe("landing offer specimens", () => {
  it("uses mixed sectors instead of only comercio and servicios", () => {
    const sectors = new Set(offerDeals.map((deal) => deal.sector));
    expect(sectors.has("industria")).toBe(true);
    expect(sectors.has("transporte")).toBe(true);
    expect(sectors.size).toBeGreaterThanOrEqual(6);
    expect(offerDeals.filter((deal) => deal.sector === "comercio" || deal.sector === "servicios").length).toBeLessThan(
      offerDeals.length,
    );
  });

  it("maps each specimen to a matching CNAE and sector photo", () => {
    for (const [index, deal] of offerDeals.entries()) {
      const card = showcaseToProjectCard(deal, index);
      expect(card.sectorKey).toBe(deal.sector);
      expect(card.cnaeCode).toMatch(/^\d{2}\.\d{2}$/);
      expect(deal.image.startsWith("/sectors/")).toBe(true);
    }
  });
});
