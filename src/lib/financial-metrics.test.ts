import { describe, expect, it } from "vitest";
import type { SabiYear } from "./sabi/insights";
import {
  capexProxyCents,
  capexToSalesAverage,
  cashRunway,
  costPerEmployeeCents,
  ebitdaToCashConversion,
  fichaClosedYearCount,
  fondoDeManiobraCents,
  headlineEbitda,
  headlineEbitdaMargin,
  headlineLeverage,
  interestCoverageIsNs,
  latestClosedYears,
  netProfitMarginPercent,
  nofCents,
  nofDeltaCents,
  nofToSalesPercent,
  revenuePerEmployeeCents,
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

describe("headlineEbitda", () => {
  it("makes approved adjusted EBITDA the primary figure", () => {
    const shown = headlineEbitda({
      ebitdaCents: 310_000_00,
      adjustedEbitdaCents: 340_000_00,
      hasApprovedAdjustments: true,
      hasPendingAdjustments: false,
    });
    expect(shown.primaryCents).toBe(340_000_00);
    expect(shown.primaryLabel).toBe("EBITDA aj.");
    expect(shown.secondaryCents).toBe(310_000_00);
    expect(shown.pendingReview).toBe(false);
  });

  it("keeps reported EBITDA when an adjustment is still in review", () => {
    const shown = headlineEbitda({
      ebitdaCents: 310_000_00,
      adjustedEbitdaCents: 310_000_00,
      hasApprovedAdjustments: false,
      hasPendingAdjustments: true,
    });
    expect(shown.primaryCents).toBe(310_000_00);
    expect(shown.primaryLabel).toBe("EBITDA");
    expect(shown.pendingReview).toBe(true);
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

/** Olivo-style 2024: CA 400k, caja 95k, CL 160k, ST 60k, LT 110k. */
function olivo2024(): SabiYear {
  return year({
    year: 2024,
    currentAssetsCents: 40_000_000,
    cashCents: 9_500_000,
    currentLiabilitiesCents: 16_000_000,
    shortTermDebtCents: 6_000_000,
    longTermDebtCents: 11_000_000,
    revenueCents: 88_785_000,
  });
}

/** Empresa Tecnología 2024 (euro cents): ventas 5 M, EBITDA 750 k, aj. 800 k. */
function tecnologia2024(): SabiYear {
  return year({
    year: 2024,
    revenueCents: 500_000_000,
    ebitdaCents: 75_000_000,
    ebitCents: 60_000_000,
    staffCostsCents: -210_000_000,
    employees: 32,
    currentAssetsCents: 180_000_000,
    cashCents: 40_000_000,
    currentLiabilitiesCents: 90_000_000,
    shortTermDebtCents: 20_000_000,
    longTermDebtCents: 50_000_000,
    nonCurrentAssetsCents: 220_000_000,
  });
}

function tecnologia2023(): SabiYear {
  return year({
    year: 2023,
    revenueCents: 460_000_000,
    ebitdaCents: 68_000_000,
    ebitCents: 55_000_000,
    currentAssetsCents: 160_000_000,
    cashCents: 35_000_000,
    currentLiabilitiesCents: 80_000_000,
    shortTermDebtCents: 18_000_000,
    longTermDebtCents: 48_000_000,
    nonCurrentAssetsCents: 200_000_000,
  });
}

describe("NOF, fondo de maniobra and ΔNOF", () => {
  it("computes Olivo 2024: NOF 205 k, FM 240 k", () => {
    const last = olivo2024();
    expect(nofCents(last)).toBe(20_500_000);
    expect(fondoDeManiobraCents(last)).toBe(24_000_000);
    expect(nofToSalesPercent(last)).toBeCloseTo((20_500_000 / 88_785_000) * 100, 5);
  });

  it("computes Tecnología 2024: NOF 700 k, FM 900 k, DFN 300 k", () => {
    const last = tecnologia2024();
    expect(nofCents(last)).toBe(70_000_000);
    expect(fondoDeManiobraCents(last)).toBe(90_000_000);
    expect(nofToSalesPercent(last)).toBeCloseTo(14, 5);
  });

  it("computes ΔNOF as this year's NOF minus last year's", () => {
    expect(nofDeltaCents(tecnologia2024(), tecnologia2023())).toBe(7_000_000);
    expect(nofDeltaCents(tecnologia2024(), null)).toBeNull();
  });
});

describe("headlineLeverage", () => {
  it("makes DFN / EBITDA aj. the primary multiple when adjustments are approved", () => {
    const shown = headlineLeverage({
      netDebtCents: 30_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: 80_000_000,
      hasApprovedAdjustments: true,
    });
    expect(shown.primaryLabel).toBe("Deuda neta / EBITDA aj.");
    expect(shown.primaryTimes).toBeCloseTo(0.375, 5);
    expect(shown.secondaryTimes).toBeCloseTo(0.4, 5);
    expect(shown.secondaryLabel).toBe("Deuda neta / EBITDA de las cuentas");
    expect(shown.ns).toBe(false);
  });

  it("keeps accounts DFN / EBITDA when there is no approved adjustment", () => {
    const shown = headlineLeverage({
      netDebtCents: 30_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: 80_000_000,
      hasApprovedAdjustments: false,
    });
    expect(shown.primaryLabel).toBe("Deuda neta / EBITDA");
    expect(shown.primaryTimes).toBeCloseTo(0.4, 5);
    expect(shown.secondaryTimes).toBeNull();
  });

  it("is n/s when there is net debt and EBITDA is not positive", () => {
    const shown = headlineLeverage({
      netDebtCents: 30_000_000,
      ebitdaCents: -1,
      adjustedEbitdaCents: null,
      hasApprovedAdjustments: false,
    });
    expect(shown.ns).toBe(true);
    expect(shown.primaryTimes).toBeNull();
  });
});

describe("ebitdaToCashConversion and capex proxy", () => {
  it("uses (EBITDA − ΔNOF − capex) / EBITDA and labels n/s when EBITDA ≤ 0", () => {
    const last = tecnologia2024();
    const previous = tecnologia2023();
    expect(capexProxyCents(last, previous)).toBe(35_000_000);
    const conversion = ebitdaToCashConversion(last, previous);
    expect(conversion?.ns).toBe(false);
    expect(conversion?.ratio).toBeCloseTo((75_000_000 - 7_000_000 - 35_000_000) / 75_000_000, 5);
    expect(ebitdaToCashConversion(year({ year: 2024, ebitdaCents: 0 }), previous)).toEqual({ ratio: null, ns: true });
    expect(ebitdaToCashConversion(year({ year: 2024, ebitdaCents: -1 }), previous)).toEqual({ ratio: null, ns: true });
  });

  it("averages capex/ventas over the last three years that have both", () => {
    const y2022 = year({
      year: 2022,
      revenueCents: 430_000_000,
      ebitdaCents: 62_000_000,
      ebitCents: 50_000_000,
      nonCurrentAssetsCents: 185_000_000,
    });
    const y2023 = tecnologia2023();
    const y2024 = tecnologia2024();
    const share2023 = (28_000_000 / 460_000_000) * 100;
    const share2024 = (35_000_000 / 500_000_000) * 100;
    expect(capexToSalesAverage([y2022, y2023, y2024])).toBeCloseTo((share2023 + share2024) / 2, 5);
  });
});

describe("staff productivity from the accounts", () => {
  it("divides staff cost and ventas by plantilla", () => {
    const last = tecnologia2024();
    expect(costPerEmployeeCents(last)).toBe(6_562_500);
    expect(revenuePerEmployeeCents(last)).toBe(15_625_000);
    expect(costPerEmployeeCents(year({ year: 2024, staffCostsCents: 1, employees: 0 }))).toBeNull();
  });
});
