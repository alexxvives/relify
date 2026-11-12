import { describe, expect, it } from "vitest";
import type { SabiYear } from "@/lib/sabi/insights";
import { sellerKeyFigures, sellerOperatingFigures } from "@/lib/seller-key-figures";

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
    expect(tiles.some((tile) => tile.key === "debt")).toBe(false);
    expect(tiles.some((tile) => tile.key === "netDebt")).toBe(false);
    expect(tiles.some((tile) => tile.key === "equity")).toBe(false);
  });

  it("adds EBITDA margin from the same year so a full year gives 8 tiles", () => {
    const full = year({
      year: 2024, revenueCents: 1_000_000, ebitdaCents: 123_400, netResultCents: 1, employees: 3,
      totalAssetsCents: 1, equityCents: 1, longTermDebtCents: 1, cashCents: 0,
    });
    const tiles = sellerKeyFigures([full]);
    expect(tiles).toHaveLength(8);
    expect(tiles[2]).toMatchObject({ key: "ebitdaMargin", unit: "percent", value: 12.3 });
    expect(tiles.some((tile) => tile.key === "debt")).toBe(false);
    expect(tiles.some((tile) => tile.key === "netDebt")).toBe(true);
    expect(sellerKeyFigures([year({ year: 2024, revenueCents: 0, ebitdaCents: 5 })]).some((tile) => tile.key === "ebitdaMargin")).toBe(false);
  });

  it("adds deuda neta when cash and financial debt are present", () => {
    const tiles = sellerKeyFigures([
      year({ year: 2024, longTermDebtCents: 80, shortTermDebtCents: 20, cashCents: 30 }),
    ]);
    expect(tiles.find((tile) => tile.key === "netDebt")).toMatchObject({ value: 70, year: 2024 });
  });

  it("returns nothing without figures", () => {
    expect(sellerKeyFigures(null)).toEqual([]);
  });

  it("puts NOF and staff ratios in Ver detalle, not in the 8 tiles", () => {
    const last = year({
      year: 2024,
      revenueCents: 500_000_000,
      ebitdaCents: 75_000_000,
      ebitCents: 60_000_000,
      netResultCents: 60_000_000,
      totalAssetsCents: 400_000_000,
      equityCents: 250_000_000,
      staffCostsCents: -210_000_000,
      employees: 32,
      currentAssetsCents: 180_000_000,
      cashCents: 40_000_000,
      currentLiabilitiesCents: 90_000_000,
      shortTermDebtCents: 20_000_000,
      longTermDebtCents: 50_000_000,
      nonCurrentAssetsCents: 220_000_000,
      ratios: { collectionDays: 45, creditDays: 38 },
    });
    const previous = year({
      year: 2023,
      revenueCents: 460_000_000,
      ebitdaCents: 68_000_000,
      ebitCents: 55_000_000,
      currentAssetsCents: 160_000_000,
      cashCents: 35_000_000,
      currentLiabilitiesCents: 80_000_000,
      shortTermDebtCents: 18_000_000,
      nonCurrentAssetsCents: 200_000_000,
    });
    const extra = sellerOperatingFigures([previous, last]);
    expect(extra.find((row) => row.key === "nof")?.display).toBe("700 K €");
    expect(extra.find((row) => row.key === "nofDelta")?.display).toBe("70 K €");
    expect(extra.find((row) => row.key === "workingCapital")?.display).toBe("900 K €");
    expect(extra.find((row) => row.key === "collectionDays")?.display).toBe("45 días");
    expect(sellerKeyFigures([last])).toHaveLength(8);
    expect(sellerKeyFigures([last]).some((tile) => tile.key === "nof")).toBe(false);
  });
});
