import { describe, expect, it } from "vitest";
import type { SabiYear } from "./sabi/insights";
import { sellerKeyFigures } from "./seller-key-figures";

function year(values: Partial<SabiYear> & { year: number }): SabiYear {
  const empty = Object.fromEntries(
    ["months", "employees", "revenueCents", "suppliesCents", "staffCostsCents", "ebitdaCents", "ebitCents", "financialResultCents",
      "profitBeforeTaxCents", "netResultCents", "totalAssetsCents", "nonCurrentAssetsCents", "currentAssetsCents", "cashCents",
      "equityCents", "nonCurrentLiabilitiesCents", "currentLiabilitiesCents", "longTermDebtCents", "shortTermDebtCents",
      "workingCapitalCents"].map((key) => [key, null]),
  );
  return { ...empty, ratios: {}, ...values } as SabiYear;
}

describe("sellerKeyFigures", () => {
  it("takes each metric from the latest year that has it and keeps that year", () => {
    const tiles = sellerKeyFigures([
      year({ year: 2023, revenueCents: 100, employees: 5, months: 12 }),
      year({ year: 2024, revenueCents: 200, longTermDebtCents: 30, shortTermDebtCents: 20, months: 11 }),
    ]);
    expect(tiles.find((tile) => tile.key === "revenue")).toMatchObject({ value: 200, year: 2024, months: 11 });
    expect(tiles.find((tile) => tile.key === "employees")).toMatchObject({ value: 5, year: 2023, months: null });
    expect(tiles.find((tile) => tile.key === "debt")).toMatchObject({ value: 50, year: 2024 });
    expect(tiles.some((tile) => tile.key === "equity")).toBe(false);
  });

  it("adds EBITDA margin from the same year so a full year gives 8 tiles (t79)", () => {
    const full = year({
      year: 2024, revenueCents: 1_000_000, ebitdaCents: 123_400, netResultCents: 1, employees: 3,
      totalAssetsCents: 1, equityCents: 1, longTermDebtCents: 1,
    });
    const tiles = sellerKeyFigures([full]);
    expect(tiles).toHaveLength(8);
    expect(tiles[2]).toMatchObject({ key: "ebitdaMargin", unit: "percent", value: 12.3 });
    expect(sellerKeyFigures([year({ year: 2024, revenueCents: 0, ebitdaCents: 5 })]).some((tile) => tile.key === "ebitdaMargin")).toBe(false);
  });

  it("returns nothing without figures", () => {
    expect(sellerKeyFigures(null)).toEqual([]);
  });
});
