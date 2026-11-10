import { describe, expect, it } from "vitest";
import { offerDeals } from "./landing-copy";
import { landingPreviewHref, parseShowcaseMoney, showcaseToProjectCard } from "./showcase-card";

describe("parseShowcaseMoney", () => {
  it("parses K and M showcase figures into cents", () => {
    expect(parseShowcaseMoney("240K €")).toBe(24_000_000);
    expect(parseShowcaseMoney("48K €")).toBe(4_800_000);
    expect(parseShowcaseMoney("4,8M €")).toBe(480_000_000);
    expect(parseShowcaseMoney("1.1M €")).toBe(110_000_000);
  });
});

describe("showcaseToProjectCard", () => {
  it("builds a marketplace card from the first landing specimen", () => {
    const deal = offerDeals[0];
    expect(deal).toBeDefined();
    if (!deal) {
      return;
    }
    const card = showcaseToProjectCard(deal, 0);
    expect(card.codename).toBe(deal.codename);
    expect(card.region).toBe(deal.region);
    expect(card.sectorKey).toBe("comercio");
    expect(card.cnaeCode).toBe("47.11");
    expect(card.summary).toMatch(/proximidad/);
    expect(card.hasAdjustments).toBe(true);
    expect(card.askingPriceCents).toBe(19_000_000);
    expect(card.headcount).toBe("band_6_10");
    expect(landingPreviewHref).toBe("/lista-de-espera");
  });
});
