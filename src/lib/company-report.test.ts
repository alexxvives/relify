import { describe, expect, it } from "vitest";
import { diligenceChecks, healthSignals, registryForRole, reportFlags, reportSummary } from "./company-report";
import type { SabiYear } from "./sabi/insights";
import type { SabiRegistry } from "./sabi/registry";

const year = (overrides: Partial<SabiYear>): SabiYear => ({
  year: 2023,
  months: 12,
  employees: 10,
  revenueCents: 100_000_000,
  suppliesCents: null,
  staffCostsCents: null,
  ebitdaCents: 20_000_000,
  ebitCents: 15_000_000,
  financialResultCents: null,
  profitBeforeTaxCents: null,
  netResultCents: 10_000_000,
  totalAssetsCents: 200_000_000,
  nonCurrentAssetsCents: null,
  currentAssetsCents: 90_000_000,
  cashCents: 10_000_000,
  equityCents: 100_000_000,
  nonCurrentLiabilitiesCents: null,
  currentLiabilitiesCents: 60_000_000,
  longTermDebtCents: 40_000_000,
  shortTermDebtCents: 20_000_000,
  workingCapitalCents: null,
  ratios: {},
  ...overrides,
});

describe("company report", () => {
  it("never hands registry identities to buyers", () => {
    const registry = { directors: [{ name: "X" }] } as unknown as SabiRegistry;
    expect(registryForRole(registry, "buyer")).toBeNull();
    expect(registryForRole(registry, "admin")).toBe(registry);
    expect(registryForRole(registry, "seller")).toBe(registry);
    expect(registryForRole(null, "admin")).toBeNull();
  });

  it("reads net debt as years of EBITDA", () => {
    const [debt] = healthSignals([year({})]);
    expect(debt?.key).toBe("netDebtToEbitda");
    expect(debt?.value).toBe(2.5);
    expect(debt?.level).toBe("warn");
    expect(debt?.reading).toContain("2,5 años de EBITDA");
  });

  it("treats net cash as good and debt without EBITDA as bad", () => {
    expect(healthSignals([year({ cashCents: 90_000_000 })])[0]?.level).toBe("good");
    const bad = healthSignals([year({ ebitdaCents: -1 })])[0];
    expect(bad?.level).toBe("bad");
    expect(bad?.display).toBe("EBITDA ≤ 0");
  });

  it("scores liquidity and solvency on their thresholds", () => {
    const signals = healthSignals([year({ ratios: { liquidityRatio: 0.8, interestCoverage: 6, collectionDays: 95 } })]);
    const by = Object.fromEntries(signals.map((signal) => [signal.key, signal.level]));
    expect(by).toEqual({ netDebtToEbitda: "warn", liquidity: "good", acid: "warn", solvency: "good", interestCoverage: "good", collectionDays: "bad" });
  });

  it("summarises only the numbers on file", () => {
    const lines = reportSummary([year({ year: 2021, revenueCents: 50_000_000 }), year({ year: 2022, revenueCents: 80_000_000 }), year({ netResultCents: -5_000_000 })]);
    expect(lines[0]).toBe("Los ingresos han pasado de 500K € en 2021 a 1M € en 2023 (+100 %, +41,4 % de media al año).");
    expect(lines[1]).toBe("En el último ejercicio (2023) crecieron un 25 % frente a 2022.");
    expect(lines[2]).toContain("margen del 20 %");
    expect(lines[3]).toBe("Cerró 2023 con pérdidas de 50K € y ha tenido beneficios en 2 de los 3 ejercicios disponibles.");
    expect(reportSummary([])).toEqual([]);
  });

  it("raises flags in both directions", () => {
    const flags = reportFlags([year({ year: 2022 }), year({ revenueCents: 90_000_000, netResultCents: -1 })]);
    expect(flags[0]).toEqual({ level: "warn", text: "Ingresos a la baja en 2023 (-10 %)" });
    expect(flags[1]).toEqual({ level: "warn", text: "Pérdidas en 2023" });
  });
});

describe("diligenceChecks", () => {
  it("measures growth from the first meaningful year, not an almost empty start-up year", () => {
    const years = [
      year({ year: 2021, months: 5, revenueCents: 100_000, ebitdaCents: -13_000_000, netResultCents: -13_000_000 }),
      year({ year: 2022, revenueCents: 40_000_000 }),
      year({ year: 2023, revenueCents: 80_000_000 }),
      year({ year: 2024, revenueCents: 148_000_000 }),
    ];
    const [growth] = reportSummary(years);
    expect(growth).toContain("de 400K € en 2022 a 1,5M € en 2024 (+270 %");
    expect(growth).toContain("No se compara con 2021");
    expect(growth).not.toContain("147");
  });

  it("does not give a % change over a tiny base year in the flags", () => {
    const flags = reportFlags([year({ year: 2023, revenueCents: 100_000 }), year({ year: 2024, revenueCents: 148_000_000 })]);
    expect(flags[0]!.text).toBe("Ingresos al alza en 2024 (2023 no comparable)");
  });

  it("returns nothing without years", () => {
    expect(diligenceChecks([])).toEqual([]);
  });

  it("flags losses, short years, missing audit and computes runway and NOF from real fields only", () => {
    const checks = diligenceChecks([
      year({ year: 2022, netResultCents: -5_000_000, currentAssetsCents: 80_000_000, currentLiabilitiesCents: 60_000_000, cashCents: 10_000_000, shortTermDebtCents: 20_000_000, nonCurrentAssetsCents: 100_000_000 }),
      year({ year: 2023, months: 11, netResultCents: -8_000_000, ebitdaCents: -12_000_000, ebitCents: -14_000_000, nonCurrentAssetsCents: 101_000_000 }),
    ]);
    const byKey = Object.fromEntries(checks.map((check) => [check.key, check]));
    expect(byKey.information!.level).toBe("warn");
    expect(byKey.information!.text).toContain("11 meses");
    expect(byKey.losses!.level).toBe("bad");
    // 10 M cents cash / (12 M cents / 11 months) = 9.2 months
    expect(byKey.runway!.value).toBe("≈ 9 meses");
    // NOF 2023: (90 − 10) − (60 − 20) = 40 M cents; 2022: (80 − 10) − (60 − 20) = 30 M cents
    expect(byKey.cashConversion!.text).toContain("aumento de NOF");
    // capex: (101 − 100) M + (−12 − −14) M = 3 M cents
    expect(byKey.capex!.value.startsWith("30")).toBe(true);
    expect(byKey.debtMaturity!.value).toContain("33,3 %");
  });

  it("marks audited, profitable companies as good", () => {
    const checks = diligenceChecks([year({})], [{ year: 2023, closingOn: null, opinion: "Favorable", auditorName: "X", auditorCode: null, fields: {} }]);
    expect(checks.find((check) => check.key === "information")!.level).toBe("good");
    expect(checks.find((check) => check.key === "information")!.value).not.toContain("X");
  });
});

describe("diligenceChecks audit source", () => {
  it("says the seller declares an audit when the registry has no report", () => {
    const info = diligenceChecks([year({})], [], true).find((check) => check.key === "information")!;
    expect(info.value).toContain("según el vendedor");
    expect(info.text).toContain("pedir la opinión");
  });
});
