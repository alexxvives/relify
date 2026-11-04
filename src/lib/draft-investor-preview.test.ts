import { describe, expect, it } from "vitest";
import { emptyCompanyDraft } from "./company-draft";
import { draftInvestorPreview } from "./draft-investor-preview";

describe("draftInvestorPreview", () => {
  it("keeps client shares on a consumer company so the investor view can hide the chart without losing them", () => {
    const preview = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      codename: "Proyecto Cala",
      region: "Andalucía",
      revenue: "1000000",
      ebitda: "250000",
      adjustedEbitda: "200000",
      askingPrice: "1200000",
      customerBase: "consumer",
      clientPercents: ["60", "40"],
      capitalPercents: ["100"],
      productPercents: ["100"],
    });

    expect(preview.customerBase).toBe("consumer");
    expect(preview.clients.map((slice) => slice.basisPoints)).toEqual([6000, 4000]);
    expect(preview.askingPriceCents).toBe(120_000_000);
    expect(preview.codename).toBe("Proyecto Cala");
    expect(preview.slug).not.toContain(" ");
  });

  it("keeps a negative EBITDA and its margin (t80, DEALE showed 0 €)", () => {
    const preview = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      revenue: "1654133,67",
      ebitda: "-109998,88",
      adjustedEbitda: "-80000",
    });
    expect(preview.ebitdaCents).toBe(-10_999_888);
    expect(preview.adjustedEbitdaCents).toBe(-8_000_000);
    expect(preview.ebitdaMarginBp).toBe(-665);
  });
});
