import { describe, expect, it } from "vitest";
import type { SabiYear } from "@/lib/sabi/insights";
import { compactEur, formatValue, isComparableBase, metrics, registryText, reportMargins } from "@/lib/report-format";

describe("registryText", () => {
  it("flattens line breaks and turns ALL CAPS into sentence case", () => {
    expect(registryText("LA INTERMEDIACION EN LA\nPRESTACION DE SERVICIOS.   OTRAS\r\nACTIVIDADES")).toBe("La intermediacion en la prestacion de servicios. Otras actividades");
  });

  it("keeps mixed-case text as written", () => {
    expect(registryText("Software  para\nPymes")).toBe("Software para Pymes");
  });
});

describe("compactEur", () => {
  it("uses one K/M style with a decimal comma", () => {
    expect(compactEur(-36_400_000)).toBe("-364 K €");
    expect(compactEur(170_000_000)).toBe("1,7 M €");
    expect(compactEur(165_000_000)).toBe("1,65 M €");
    expect(compactEur(5_740_000)).toBe("57,4 K €");
    expect(compactEur(85_000)).toBe("850 €");
    expect(formatValue(57.4, "keur")).toBe("57,4 K €");
  });
});

describe("not significant percentages", () => {
  const year = (overrides: Partial<SabiYear>) => ({ year: 2024, months: 12, revenueCents: null, ebitdaCents: null, netResultCents: null, ratios: {}, ...overrides }) as SabiYear;

  it("rejects tiny, negative, zero and partial bases", () => {
    expect(isComparableBase(1_000, 1_000_000)).toBe(false);
    expect(isComparableBase(0, 1_000_000)).toBe(false);
    expect(isComparableBase(-5, 10)).toBe(false);
    expect(isComparableBase(500_000, 1_000_000, 6)).toBe(false);
    expect(isComparableBase(500_000, 1_000_000)).toBe(true);
  });

  it("blanks margins of years with negligible revenue and flags them n/s", () => {
    const years = [year({ year: 2021, revenueCents: 100_000, ebitdaCents: -13_459_200 }), year({ year: 2022, revenueCents: 1_000_000, ebitdaCents: 100_000 }), year({ year: 2023, revenueCents: 10_000_000, ebitdaCents: 1_000_000 })];
    expect(reportMargins(years, (item) => item.ebitdaCents)).toEqual({ values: [null, 10, 10], ns: [true, false, false] });
    const margin = metrics(years).kpis.find((metric) => metric.key === "ebitdaMargin")!;
    expect(margin.ns).toEqual([true, false, false]);
  });

  it("computes margen de beneficio and ROE from resultado neto, and marks cobertura n/s", () => {
    const years = [
      year({
        year: 2024,
        revenueCents: 88_785_000,
        netResultCents: -9_500_000,
        equityCents: 100_000_000,
        ebitCents: -1_000_000,
        ratios: { interestCoverage: -16, economicReturn: -14.9 },
      }),
    ];
    const { kpis, debt } = metrics(years);
    expect(kpis.find((metric) => metric.key === "profitMargin")?.values[0]).toBeCloseTo(-10.7, 1);
    expect(kpis.find((metric) => metric.key === "financialReturn")?.values[0]).toBeCloseTo(-9.5, 5);
    const coverage = debt.find((metric) => metric.key === "interestCoverage");
    expect(coverage?.values[0]).toBeNull();
    expect(coverage?.ns?.[0]).toBe(true);
  });
});
