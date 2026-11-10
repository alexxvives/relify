import { describe, expect, it } from "vitest";
import type { SabiYear } from "./sabi/insights";
import {
  cashRunway,
  fichaClosedYearCount,
  headlineEbitdaMargin,
  interestCoverageIsNs,
  latestClosedYears,
  netProfitMarginPercent,
  roePercent,
} from "./financial-metrics";

function year(overrides: Partial<SabiYear> & { year: number }): SabiYear {
  return {
    months: 12,
    employees: null,
    revenueCents: null,
    suppliesCents: null,
    staffCostsCents: null,
    ebitdaCents: null,
    ebitCents: null,
    financialResultCents: null,
    profitBeforeTaxCents: null,
    netResultCents: null,
    totalAssetsCents: null,
    nonCurrentAssetsCents: null,
    currentAssetsCents: null,
    cashCents: null,
    equityCents: null,
    nonCurrentLiabilitiesCents: null,
    currentLiabilitiesCents: null,
    longTermDebtCents: null,
    shortTermDebtCents: null,
    workingCapitalCents: null,
    ratios: {},
    ...overrides,
  };
}

describe("cashRunway", () => {
  it("uses treasury variation: 1,14 M → 167 K is about 2 months", () => {
    const previous = year({ year: 2023, cashCents: 114_000_000 });
    const last = year({ year: 2024, cashCents: 16_700_000 });
    const result = cashRunway(last, previous);
    expect(result?.kind).toBe("months");
    if (result?.kind !== "months") {
      return;
    }
    expect(result.months).toBeCloseTo(2.06, 1);
    expect(Math.round(result.months)).toBe(2);
  });

  it("says the company generates cash when tesorería increased", () => {
    const previous = year({ year: 2023, cashCents: 10_000_000 });
    const last = year({ year: 2024, cashCents: 18_000_000 });
    expect(cashRunway(last, previous)).toEqual({
      kind: "generates",
      cashCents: 18_000_000,
      startCents: 10_000_000,
      endCents: 18_000_000,
    });
  });

  it("needs both years of tesorería", () => {
    expect(cashRunway(year({ year: 2024, cashCents: 16_700_000 }), null)).toBeNull();
    expect(cashRunway(year({ year: 2024, cashCents: 16_700_000 }), year({ year: 2023 }))).toBeNull();
  });
});

describe("roePercent and netProfitMarginPercent", () => {
  it("uses resultado neto, matching the ClickUp 2024 example", () => {
    const sample = year({
      year: 2024,
      netResultCents: -9_500_000,
      equityCents: 100_000_000,
      revenueCents: 88_785_000,
      profitBeforeTaxCents: -14_900_000,
    });
    expect(roePercent(sample)).toBeCloseTo(-9.5, 5);
    expect(netProfitMarginPercent(sample)).toBeCloseTo(-10.7, 1);
  });

  it("returns null without equity or sales", () => {
    expect(roePercent(year({ year: 2024, netResultCents: 1, equityCents: 0 }))).toBeNull();
    expect(netProfitMarginPercent(year({ year: 2024, netResultCents: 1, revenueCents: 0 }))).toBeNull();
  });
});

describe("interestCoverageIsNs", () => {
  it("is n/s when EBIT is negative, even if SABI stored -16x", () => {
    expect(interestCoverageIsNs(year({ year: 2024, ebitCents: -1_000_000, ratios: { interestCoverage: -16 } }))).toBe(true);
  });

  it("is n/s without gastos financieros", () => {
    expect(interestCoverageIsNs(year({ year: 2024, ebitCents: 2_000_000, ratios: {} }))).toBe(true);
  });

  it("keeps a positive cover", () => {
    expect(interestCoverageIsNs(year({ year: 2024, ebitCents: 2_000_000, ratios: { interestCoverage: 6 } }))).toBe(false);
  });
});

describe("headlineEbitdaMargin", () => {
  it("uses adjusted / ventas as primary when adjustments exist", () => {
    const margin = headlineEbitdaMargin({
      revenueCents: 10_000_000,
      ebitdaCents: 1_000_000,
      adjustedEbitdaCents: 1_500_000,
      hasAdjustments: true,
    });
    expect(margin.primaryLabel).toBe("Margen EBITDA ajustado");
    expect(margin.primaryBp).toBe(1500);
    expect(margin.secondaryLabel).toBe("Margen EBITDA");
    expect(margin.secondaryBp).toBe(1000);
  });

  it("keeps the reported margin when there is no adjustment", () => {
    const margin = headlineEbitdaMargin({
      revenueCents: 10_000_000,
      ebitdaCents: 1_000_000,
      adjustedEbitdaCents: 0,
      hasAdjustments: false,
    });
    expect(margin.primaryLabel).toBe("Margen EBITDA");
    expect(margin.primaryBp).toBe(1000);
    expect(margin.secondaryBp).toBeNull();
  });
});

describe("latestClosedYears", () => {
  it("keeps the last four", () => {
    expect(fichaClosedYearCount).toBe(4);
    expect(latestClosedYears([{ year: 2020 }, { year: 2021 }, { year: 2022 }, { year: 2023 }, { year: 2024 }]).map((item) => item.year)).toEqual([
      2021, 2022, 2023, 2024,
    ]);
  });
});
