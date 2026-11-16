import { describe, expect, it } from "vitest";
import {
  confirmFilingSchema,
  filingAmountKeys,
  filingKind,
  filingYears,
  mergeExtractions,
  normaliseModelOutput,
  parseEuroInput,
  readCasillas,
  reviewFlags,
  salesGrowth,
  storedCents,
  yearRatios,
} from "@/lib/financial-filing";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("parseEuroInput", () => {
  it("reads Spanish and plain formats", () => {
    expect(parseEuroInput("1.250.430,55")).toBe(1250430.55);
    expect(parseEuroInput("12.000")).toBe(12000);
    expect(parseEuroInput("1234567.89")).toBe(1234567.89);
    expect(parseEuroInput("-4.200 €")).toBe(-4200);
    expect(parseEuroInput("(310.250,00)")).toBe(-310250);
  });

  it("rejects text", () => {
    expect(parseEuroInput("abc")).toBeNull();
    expect(parseEuroInput("")).toBeNull();
    expect(parseEuroInput("1e5")).toBeNull();
  });
});

describe("filingKind", () => {
  it("detects by magic bytes, not by extension", () => {
    expect(filingKind(bytes("%PDF-1.4 ..."), "m200.pdf")).toBe("modelo200");
    expect(filingKind(bytes("%PDF-1.7"), "Cuentas anuales 2024.pdf")).toBe("cuentas");
    expect(filingKind(bytes('<?xml version="1.0"?><xbrl>'), "c.xbrl")).toBe("xbrl");
    expect(filingKind(new Uint8Array([0x50, 0x4b, 3, 4]), "c.zip")).toBe("xbrl");
    expect(filingKind(bytes("MZ binary"), "fake.pdf")).toBeNull();
  });
});

describe("filingYears", () => {
  it("shows the three years before the current one", () => {
    expect(filingYears(new Date("2026-10-29T10:00:00Z"))).toEqual([2025, 2024, 2023]);
  });
});

describe("ratios", () => {
  const amounts = {
    sales: 1000,
    operatingResult: 100,
    amortization: 50,
    netResult: 60,
    equity: 400,
    longTermDebt: 150,
    shortTermDebt: 50,
    cash: 80,
    currentAssets: 300,
    suppliers: 100,
  };

  it("computes EBITDA, margins, leverage and liquidity", () => {
    const r = yearRatios(amounts);
    expect(r.ebitda).toBe(150);
    expect(r.ebitdaMargin).toBeCloseTo(0.15);
    expect(r.netMargin).toBeCloseTo(0.06);
    expect(r.leverage).toBeCloseTo(0.5);
    expect(r.netDebt).toBe(120);
    expect(r.liquidity).toBeCloseTo(2);
  });

  it("returns null instead of dividing by zero", () => {
    const r = yearRatios({ sales: 0, operatingResult: 10, amortization: 1, equity: 0, shortTermDebt: 0 });
    expect(r.ebitdaMargin).toBeNull();
    expect(r.leverage).toBeNull();
    expect(r.liquidity).toBeNull();
  });

  it("computes compound sales growth", () => {
    expect(
      salesGrowth([
        { year: 2025, sales: 121 },
        { year: 2023, sales: 100 },
        { year: 2024, sales: null },
      ]),
    ).toBeCloseTo(0.1);
    expect(salesGrowth([{ year: 2025, sales: 100 }])).toBeNull();
  });
});

describe("casillas and model output", () => {
  it("reads Modelo 200 casillas with costs positive", () => {
    const found = readCasillas("00255 Importe neto 1.250.430,55\n00260 Aprovisionamientos -612.300,10\n00296 Resultado 98.760,45");
    expect(found.sales).toEqual({ value: 1250430.55, confidence: "alta" });
    expect(found.supplies?.value).toBe(612300.1);
    expect(found.operatingResult?.value).toBe(98760.45);
    expect(found.staffCosts).toBeUndefined();
  });

  it("drops junk from the model and caps confidence", () => {
    const out = normaliseModelOutput({
      year: 2025,
      cnae: "47.11",
      averageHeadcount: 12.5,
      fields: { sales: { value: "1.000,00", confidence: "alta" }, staffCosts: { value: -300, confidence: "seguro" }, equity: { value: "n/d" } },
    });
    expect(out.amounts.sales).toEqual({ value: 1000, confidence: "alta" });
    expect(out.amounts.staffCosts).toEqual({ value: 300, confidence: "baja" });
    expect(out.amounts.equity).toBeUndefined();
    expect(out.cnae.value).toBe("4711");
    expect(out.documentYear).toBe(2025);
  });

  it("marks disagreements between casillas and the model as low confidence", () => {
    const model = normaliseModelOutput({ fields: { sales: { value: 900, confidence: "alta" }, supplies: { value: 50, confidence: "alta" } } });
    const merged = mergeExtractions({ sales: { value: 1000, confidence: "alta" }, supplies: { value: 50, confidence: "alta" } }, model);
    expect(merged.amounts.sales).toEqual({ value: 1000, confidence: "baja" });
    expect(merged.amounts.supplies?.confidence).toBe("alta");
    expect(merged.method).toBe("casillas+ia");
  });

  it("flags a BAI that does not add up", () => {
    const flags = reviewFlags({ operatingResult: 100, financialResult: -10, profitBeforeTax: 80 }, null);
    expect(flags.has("profitBeforeTax")).toBe(true);
  });
});

describe("confirmFilingSchema", () => {
  it("parses euro strings and rejects bad CNAE", () => {
    const amounts: Record<string, string> = { ...Object.fromEntries(filingAmountKeys.map((key) => [key, ""])), sales: "1.000,50" };
    const ok = confirmFilingSchema.safeParse({ year: 2025, amounts, cnae: "4711", averageHeadcount: "12,5" });
    expect(ok.success).toBe(true);
    expect(ok.success && ok.data.amounts.sales).toBe(1000.5);
    expect(ok.success && ok.data.averageHeadcount).toBe(12.5);
    expect(confirmFilingSchema.safeParse({ year: 2025, amounts, cnae: "47", averageHeadcount: "" }).success).toBe(false);
    expect(confirmFilingSchema.safeParse({ year: 2025, amounts: { ...amounts, sales: "mucho" }, cnae: "", averageHeadcount: "" }).success).toBe(false);
  });

  it("stores costs negative", () => {
    expect(storedCents("staffCosts", 300)).toBe(-30000);
    expect(storedCents("sales", 300)).toBe(30000);
  });
});
