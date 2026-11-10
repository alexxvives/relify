import { describe, expect, it } from "vitest";
import { buyerProjectView } from "./report-veil";
import { diligenceChecks, healthSignals, registryForRole, reportFlags, reportHeadline, reportSourceYears, reportSummary, reportSummaryMarked, summarySegments } from "./company-report";
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

  it("uses DFN / EBITDA aj. as the headline when adjustments are approved", () => {
    const last = year({
      year: 2024,
      ebitdaCents: 75_000_000,
      cashCents: 40_000_000,
      longTermDebtCents: 50_000_000,
      shortTermDebtCents: 20_000_000,
    });
    const [debt] = healthSignals([last], { hasApprovedAdjustments: true, adjustedEbitdaCents: 80_000_000 });
    expect(debt?.value).toBeCloseTo(0.375, 5);
    expect(debt?.reading).toContain("EBITDA aj.");
    expect(debt?.hint).toContain("EBITDA de las cuentas");
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

  it("shows cobertura de intereses as n/s when EBIT is negative instead of -16x", () => {
    const [coverage] = healthSignals([year({ ebitCents: -1_000_000, ratios: { interestCoverage: -16 } })]).filter((signal) => signal.key === "interestCoverage");
    expect(coverage?.display).toBe("n/s");
    expect(coverage?.ns).toBe(true);
    expect(coverage?.reading).toContain("No significativo");
  });

  it("says caja generates cash when tesorería rose", () => {
    const checks = diligenceChecks([
      year({ year: 2023, cashCents: 10_000_000 }),
      year({ year: 2024, cashCents: 18_000_000 }),
    ]);
    expect(checks.find((check) => check.key === "runway")?.value).toBe("No aplica (genera caja)");
  });

  it("summarises only the numbers on file", () => {
    const lines = reportSummary([year({ year: 2021, revenueCents: 50_000_000 }), year({ year: 2022, revenueCents: 80_000_000 }), year({ netResultCents: -5_000_000 })]);
    expect(lines[0]).toBe("La facturación ha pasado de 500 K € en 2021 a 1 M € en 2023 (+100 %, +41,4 % de media al año).");
    expect(lines[1]).toBe("En el último ejercicio (2023) crecieron un 25 % frente a 2022.");
    expect(lines[2]).toContain("margen del 20 %");
    expect(lines[3]).toBe("Cerró 2023 con pérdidas de 50 K € y ha tenido beneficios en 2 de los 3 ejercicios disponibles.");
    expect(reportSummary([])).toEqual([]);
  });

  it("raises flags in both directions", () => {
    const flags = reportFlags([year({ year: 2022 }), year({ revenueCents: 90_000_000, netResultCents: -1 })]);
    expect(flags[0]).toEqual({ level: "warn", text: "Facturación a la baja en 2023 (-10 %)" });
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
    expect(growth).toContain("de 400 K € en 2022 a 1,48 M € en 2024 (+270 %");
    expect(growth).toContain("No se compara con 2021");
    expect(growth).not.toContain("147");
  });

  it("does not give a % change over a tiny base year in the flags", () => {
    const flags = reportFlags([year({ year: 2023, revenueCents: 100_000 }), year({ year: 2024, revenueCents: 148_000_000 })]);
    expect(flags[0]!.text).toBe("Facturación al alza en 2024 (2023 no comparable)");
  });

  it("returns nothing without years", () => {
    expect(diligenceChecks([])).toEqual([]);
  });

  it("flags losses, short years, missing audit and computes runway and NOF from real fields only", () => {
    const checks = diligenceChecks([
      year({ year: 2022, netResultCents: -5_000_000, currentAssetsCents: 80_000_000, currentLiabilitiesCents: 60_000_000, cashCents: 114_000_000, shortTermDebtCents: 20_000_000, nonCurrentAssetsCents: 100_000_000 }),
      year({ year: 2023, months: 11, netResultCents: -8_000_000, ebitdaCents: -12_000_000, ebitCents: -14_000_000, cashCents: 16_700_000, nonCurrentAssetsCents: 101_000_000 }),
    ]);
    const byKey = Object.fromEntries(checks.map((check) => [check.key, check]));
    expect(byKey.information!.level).toBe("warn");
    expect(byKey.information!.text).toContain("11 meses");
    expect(byKey.losses!.level).toBe("bad");
    // (1,14 M − 167 K) / 12 → ~2 months of runway, never caja / |EBITDA|
    expect(byKey.runway!.value).toBe("≈ 2 meses");
    // NOF 2023: (90 − 10) − (60 − 20) = 40 M cents; 2022: (80 − 10) − (60 − 20) = 30 M cents
    expect(byKey.cashConversion!.text).toContain("No significativo");
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

describe("reportHeadline", () => {
  it("never lets a pending owner_salary zero the headline when the stored column is 0", () => {
    const years = [year({ year: 2024, revenueCents: 500_000_000, ebitdaCents: 75_000_000 })];
    const shown = reportHeadline({
      revenueCents: 0,
      ebitdaCents: 0,
      adjustedEbitdaCents: 0,
      ebitdaAdjustments: [
        { id: "legacy-0", type: "owner_salary", amountCents: 100_000_100, reason: "Sueldo", status: "pending", documentId: null, documentName: null },
      ],
      reportYears: years,
    });
    expect(shown.revenueCents).toBe(500_000_000);
    expect(shown.ebitdaCents).toBe(75_000_000);
    expect(shown.adjustedEbitdaCents).toBe(75_000_000);
    expect(shown.hasApprovedAdjustments).toBe(false);
    expect(shown.hasPendingAdjustments).toBe(true);
  });

  it("uses approved-adjusted EBITDA and ignores a pending row beside it", () => {
    const years = [year({ year: 2024, revenueCents: 500_000_000, ebitdaCents: 75_000_000 })];
    const shown = reportHeadline({
      revenueCents: 500_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: 0,
      ebitdaAdjustments: [
        { id: "legacy-1", type: "one_off", amountCents: 5_000_000, reason: "Extra", status: "approved", documentId: null, documentName: null },
        { id: "legacy-0", type: "owner_salary", amountCents: 100_000_100, reason: "Sueldo", status: "pending", documentId: null, documentName: null },
      ],
      reportYears: years,
    });
    expect(shown.hasApprovedAdjustments).toBe(true);
    expect(shown.adjustedEbitdaCents).toBe(80_000_000);
  });
});

describe("buyer and seller Resumen", () => {
  it("agree on the same years after the NDA", () => {
    const years = [
      year({
        year: 2023,
        revenueCents: 420_000_000,
        ebitdaCents: 68_000_000,
        cashCents: 35_000_000,
        longTermDebtCents: 48_000_000,
        shortTermDebtCents: 18_000_000,
      }),
      year({
        year: 2024,
        revenueCents: 500_000_000,
        ebitdaCents: 75_000_000,
        cashCents: 40_000_000,
        longTermDebtCents: 50_000_000,
        shortTermDebtCents: 20_000_000,
      }),
    ];
    const seller = {
      slug: "int-empresa-tecnologia",
      codename: "Proyecto Quercus",
      revenueCents: 500_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: 80_000_000,
      askingPriceCents: 4_000_000_00,
      ebitdaAdjustments: [
        { id: "legacy-1", type: "one_off", amountCents: 5_000_000, reason: "Extra", status: "approved", documentId: null, documentName: null },
        { id: "legacy-0", type: "owner_salary", amountCents: 100_000_100, reason: "Sueldo", status: "pending", documentId: null, documentName: null },
      ],
      reportYears: years,
      incomeYears: years.map((item) => ({ year: item.year, forecast: false })),
      incomeRows: [{ key: "sales", label: "Ventas", emphasis: true, values: years.map((item) => item.revenueCents) }],
      balanceRows: [],
      capital: [],
      products: [],
      clients: [],
      secondaryCnaes: [],
    } as unknown as Parameters<typeof buyerProjectView>[0];
    const buyer = buyerProjectView(seller, true);
    const sellerHeadline = reportHeadline(seller);
    const buyerHeadline = reportHeadline(buyer);
    expect(buyerHeadline.revenueCents).toBe(sellerHeadline.revenueCents);
    expect(buyerHeadline.ebitdaCents).toBe(sellerHeadline.ebitdaCents);
    expect(buyerHeadline.adjustedEbitdaCents).toBe(sellerHeadline.adjustedEbitdaCents);
    expect(buyerHeadline.hasApprovedAdjustments).toBe(true);
    expect(sellerHeadline.adjustedEbitdaCents).toBe(80_000_000);
    expect(sellerHeadline.hasPendingAdjustments).toBe(true);
    expect(buyerHeadline.hasPendingAdjustments).toBe(false);
    expect(reportSummary(reportSourceYears(buyer.reportYears), {
      hasApprovedAdjustments: buyerHeadline.hasApprovedAdjustments,
      adjustedEbitdaCents: buyerHeadline.adjustedEbitdaCents,
    })).toEqual(
      reportSummary(reportSourceYears(seller.reportYears), {
        hasApprovedAdjustments: sellerHeadline.hasApprovedAdjustments,
        adjustedEbitdaCents: sellerHeadline.adjustedEbitdaCents,
      }),
    );
    expect(reportSummary(reportSourceYears(seller.reportYears))[0]).toContain("5 M €");
    expect(reportSummary(reportSourceYears(buyer.reportYears))[0]).not.toContain("620");
  });

  it("pre-NDA buyer cards match seller preview and marketplace published figures", () => {
    const years = [
      year({ year: 2023, revenueCents: 420_000_000, ebitdaCents: 68_000_000 }),
      year({ year: 2024, revenueCents: 500_000_000, ebitdaCents: 75_000_000 }),
    ];
    const seller = {
      slug: "int-empresa-tecnologia",
      revenueCents: 500_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: 80_000_000,
      askingPriceCents: 2_000_000_00,
      ebitdaAdjustments: [
        { id: "legacy-1", type: "one_off", amountCents: 5_000_000, reason: "Extra", status: "approved", documentId: null, documentName: null },
        { id: "legacy-0", type: "owner_salary", amountCents: 100_000_100, reason: "Sueldo", status: "pending", documentId: null, documentName: null },
      ],
      reportYears: years,
      incomeYears: [],
      incomeRows: [],
      balanceRows: [],
      capital: [],
      products: [],
      clients: [],
      secondaryCnaes: [],
    } as unknown as Parameters<typeof buyerProjectView>[0];
    const sellerHeadline = reportHeadline(seller);
    const mercado = {
      revenueCents: seller.revenueCents,
      ebitdaCents: seller.ebitdaCents,
      adjustedEbitdaCents: sellerHeadline.adjustedEbitdaCents,
    };
    const buyerLocked = buyerProjectView(seller, false);
    const buyerCards = reportHeadline(buyerLocked);
    expect(buyerCards.revenueCents).toBe(sellerHeadline.revenueCents);
    expect(buyerCards.ebitdaCents).toBe(sellerHeadline.ebitdaCents);
    expect(buyerCards.adjustedEbitdaCents).toBe(sellerHeadline.adjustedEbitdaCents);
    expect(buyerCards.revenueCents).toBe(mercado.revenueCents);
    expect(buyerCards.ebitdaCents).toBe(mercado.ebitdaCents);
    expect(buyerCards.adjustedEbitdaCents).toBe(mercado.adjustedEbitdaCents);
    expect(buyerCards.revenueCents).toBe(500_000_000);
    expect(buyerCards.adjustedEbitdaCents).toBe(80_000_000);
    expect(JSON.stringify(buyerLocked.reportYears)).not.toContain("500000000");
    expect(reportSummary(reportSourceYears(buyerLocked.reportYears))[0]).not.toContain("5 M €");
  });
});

describe("summary bold segments", () => {
  it("marks key figures and splits them without HTML", () => {
    const years = [year({ year: 2021, revenueCents: 50_000_000 }), year({ year: 2022, revenueCents: 80_000_000 })];
    const [marked] = reportSummaryMarked(years);
    expect(marked).toContain("**");
    expect(reportSummary(years)[0]).toBe(marked!.replaceAll("**", ""));
    const parts = summarySegments(marked!);
    expect(parts.some((part) => part.strong)).toBe(true);
    expect(parts.map((part) => part.text).join("")).toBe(reportSummary(years)[0]);
  });
});
