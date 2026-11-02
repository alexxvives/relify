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

  it("returns nothing without figures", () => {
    expect(sellerKeyFigures(null)).toEqual([]);
  });
});
