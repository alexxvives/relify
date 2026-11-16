import { describe, expect, it } from "vitest";
import { marginPercent, netDebtCents, parseSabiPercent, pnlWaterfall, sabiOwnershipSlices, toSabiYear, yearOverYear, type SabiYearRow } from "@/lib/sabi/insights";

const holder = (name: string, direct: string | null, total: string | null = null) => ({ name, country: null, type: null, direct, total, infoDate: null });

const row: SabiYearRow = {
  year: 2024,
  months: 12,
  employees: 29,
  ratios: { profitMargin: -16.7, bad: "x" },
  salesCents: null,
  operatingRevenueCents: BigInt(166452275),
  suppliesCents: null,
  staffCostsCents: -BigInt(143000707),
  ebitdaCents: -BigInt(10999888),
  ebitCents: -BigInt(28275669),
  financialResultCents: BigInt(417422),
  profitBeforeTaxCents: -BigInt(27858247),
  netResultCents: -BigInt(17836706),
  totalAssetsCents: BigInt(256874217),
  nonCurrentAssetsCents: BigInt(153144123),
  currentAssetsCents: BigInt(103730094),
  cashCents: BigInt(16722517),
  equityCents: BigInt(186773308),
  nonCurrentLiabilitiesCents: BigInt(23753000),
  currentLiabilitiesCents: BigInt(46347909),
  longTermDebtCents: BigInt(15750000),
  shortTermDebtCents: BigInt(13092311),
  workingCapitalCents: BigInt(29463123),
};

describe("sabi insights", () => {
  it("parses SABI percentages", () => {
    expect(parseSabiPercent("100,00")).toEqual({ basisPoints: 10000, atLeast: false });
    expect(parseSabiPercent(">50,00")).toEqual({ basisPoints: 5000, atLeast: true });
    expect(parseSabiPercent("-")).toBeNull();
    expect(parseSabiPercent("<5,00")).toBeNull();
    expect(parseSabiPercent(null)).toBeNull();
  });

  it("builds ownership slices with a lower bound and a rest slice", () => {
    const slices = sabiOwnershipSlices([holder("A", ">50,00"), holder("B", "8,10"), holder("C", null), holder("D", "-")]);
    expect(slices).toEqual([
      { label: "A", basisPoints: 5000, detail: "> 50 %" },
      { label: "B", basisPoints: 810 },
      { label: "Resto (2 accionistas sin % definido)", basisPoints: 4190, detail: "< 41,9 %" },
    ]);
    expect(sabiOwnershipSlices([holder("X", null)])).toEqual([]);
    expect(sabiOwnershipSlices([holder("X", "100,00")])).toEqual([{ label: "X", basisPoints: 10000 }]);
    expect(sabiOwnershipSlices([holder("X", null, "60,00"), holder("Y", "60,00")]).map((slice) => slice.basisPoints)).toEqual([5000, 5000]);
  });

  it("converts rows and drops non-numeric ratios", () => {
    const year = toSabiYear(row);
    expect(year.revenueCents).toBe(166452275);
    expect(year.ratios).toEqual({ profitMargin: -16.7 });
    expect(netDebtCents(year)).toBe(15750000 + 13092311 - 16722517);
    expect(marginPercent(year.ebitdaCents, year.revenueCents)).toBeCloseTo(-6.608, 2);
    expect(marginPercent(1, 0)).toBeNull();
  });

  it("reconciles the P&L waterfall", () => {
    const steps = pnlWaterfall(toSabiYear(row));
    expect(steps.map((step) => step.label)).toEqual([
      "Ventas",
      "Gastos de personal",
      "Otros gastos de explotación",
      "EBITDA",
      "Amortizaciones",
      "EBIT",
      "Resultado financiero",
      "Resultado antes de impuestos",
      "Impuesto sobre beneficios",
      "Resultado del ejercicio",
    ]);
    const deltas = steps.filter((step) => step.kind === "delta").reduce((sum, step) => sum + step.value, 0);
    expect(166452275 + deltas).toBe(-17836706);
    expect(steps.find((step) => step.label === "Otros gastos de explotación")?.value).toBe(-34451456);
    expect(pnlWaterfall({ ...toSabiYear(row), netResultCents: null })).toEqual([]);
  });

  it("computes year-over-year on the last two present values", () => {
    expect(yearOverYear([1, null, 3])).toEqual({ delta: 2, previous: 1 });
    expect(yearOverYear([null, 3])).toBeNull();
  });
});
