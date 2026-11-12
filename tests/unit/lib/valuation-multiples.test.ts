import { describe, expect, it } from "vitest";
import { estimatePriceRange, priceStanding, valuationSectorFromCnae } from "@/lib/valuation-multiples";

describe("valuation multiples", () => {
  it("maps CNAE to sectors", () => {
    expect(valuationSectorFromCnae("56.10")).toBe("hosteleria");
    expect(valuationSectorFromCnae("47.11")).toBe("comercio");
    expect(valuationSectorFromCnae("69.20")).toBe("servicios_profesionales");
    expect(valuationSectorFromCnae("")).toBe("servicios");
  });

  it("estimates a range from EBITDA and sector", () => {
    const estimate = estimatePriceRange({ cnae: "56.10", ebitdaCents: 100_000_00 });
    expect(estimate?.lowCents).toBe(200_000_00);
    expect(estimate?.highCents).toBe(350_000_00);
  });

  it("adjusts for size and growth", () => {
    const estimate = estimatePriceRange({ cnae: "56.10", ebitdaCents: 100_000_00, headcount: "band_over_50", revenueGrowth: 0.2 });
    expect(estimate?.multipleLow).toBe(3);
    expect(estimate?.multipleHigh).toBe(4.5);
    expect(estimate?.adjustments).toHaveLength(2);
  });

  it("returns null without positive EBITDA", () => {
    expect(estimatePriceRange({ cnae: "56.10", ebitdaCents: 0 })).toBeNull();
    expect(estimatePriceRange({ cnae: "56.10", ebitdaCents: null })).toBeNull();
  });

  it("classifies the asking price", () => {
    const range = { lowCents: 100, highCents: 200 };
    expect(priceStanding(50, range)).toBe("below");
    expect(priceStanding(150, range)).toBe("within");
    expect(priceStanding(250, range)).toBe("above");
  });
  it("t94: EBITDA trendline is the least-squares slope over |mean|, last 3 consecutive years", async () => {
    const { ebitdaTrend } = await import("@/lib/valuation-multiples");
    // 80k, 100k, 120k → slope 20k/yr, mean 100k → +20 %/yr
    expect(ebitdaTrend([{ year: 2022, cents: 80_000_00 }, { year: 2023, cents: 100_000_00 }, { year: 2024, cents: 120_000_00 }])).toBeCloseTo(0.2);
    // only the last 3 count; an older outlier is ignored
    expect(ebitdaTrend([{ year: 2021, cents: 1_000_000_00 }, { year: 2022, cents: 80_000_00 }, { year: 2023, cents: 100_000_00 }, { year: 2024, cents: 120_000_00 }])).toBeCloseTo(0.2);
    // a gap stops the run: 2024+2023 only
    expect(ebitdaTrend([{ year: 2020, cents: 10_00 }, { year: 2023, cents: 100_000_00 }, { year: 2024, cents: 90_000_00 }])).toBeCloseTo(-10_000 / 95_000);
    expect(ebitdaTrend([{ year: 2024, cents: 100_000_00 }])).toBeNull();
    expect(ebitdaTrend([{ year: 2023, cents: 0 }, { year: 2024, cents: 0 }])).toBeNull();
    // capped at ±100 %
    expect(ebitdaTrend([{ year: 2023, cents: 10_000_00 }, { year: 2024, cents: 500_000_00 }])).toBe(1);
    // Proyecto Ónix 2022–2024 (losses shrinking) reads as an upward trend
    expect(ebitdaTrend([{ year: 2022, cents: -67069342 }, { year: 2023, cents: -36365122 }, { year: 2024, cents: -10999888 }])).toBeCloseTo(0.735, 2);
  });

  it("t94: maps the trend to the multiple and caps sales + EBITDA at ±0.75", async () => {
    const { estimatePriceRange } = await import("@/lib/valuation-multiples");
    const base = estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00 })!;
    const at = (ebitdaTrend: number | null, revenueGrowth: number | null = null) => estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00, ebitdaTrend, revenueGrowth })!;
    expect(at(0.2).multipleLow).toBe(base.multipleLow + 0.5);
    expect(at(0.2).adjustments).toContain("tendencia del EBITDA al alza (+)");
    expect(at(0.06).multipleLow).toBe(base.multipleLow + 0.25);
    expect(at(0.02)).toEqual(base);
    expect(at(-0.07).multipleLow).toBe(base.multipleLow - 0.25);
    expect(at(-0.3).multipleLow).toBe(base.multipleLow - 0.5);
    expect(at(0.3, 0.2).multipleLow).toBe(base.multipleLow + 0.75);
    expect(at(-0.3, -0.2).multipleLow).toBe(base.multipleLow - 0.75);
    expect(at(Number.NaN)).toEqual(base);
    expect(estimatePriceRange({ cnae: null, ebitdaCents: null, ebitdaTrend: 0.5 })).toBeNull();
  });

  it("t94: Proyecto Ónix worked example", async () => {
    const { estimatePriceRange } = await import("@/lib/valuation-multiples");
    const r = estimatePriceRange({ cnae: "74.90", ebitdaCents: 89000112, headcount: "band_21_50", revenueGrowth: 165413367 / 93450930 - 1, ebitdaTrend: 0.735 })!;
    expect([r.multipleLow, r.multipleHigh]).toEqual([4, 6]);
    expect([r.lowCents, r.highCents]).toEqual([3_560_000_00, 5_340_000_00]);
  });

  it("weights the last 3 available EBITDA years 50/30/20 newest to oldest", async () => {
    const { weightedEbitdaCents } = await import("@/lib/valuation-multiples");
    expect(weightedEbitdaCents([])).toBeNull();
    expect(weightedEbitdaCents([{ year: 2024, cents: 100_000_00 }])).toEqual({ cents: 100_000_00, years: [2024] });
    expect(weightedEbitdaCents([{ year: 2024, cents: 100_000_00 }, { year: 2023, cents: 80_000_00 }])).toEqual({
      cents: Math.round((100_000_00 * 0.5 + 80_000_00 * 0.3) / 0.8),
      years: [2024, 2023],
    });
    expect(
      weightedEbitdaCents([
        { year: 2024, cents: 100_000_00 },
        { year: 2023, cents: 80_000_00 },
        { year: 2022, cents: 60_000_00 },
        { year: 2021, cents: 10_000_00 },
      ]),
    ).toEqual({ cents: 86_000_00, years: [2024, 2023, 2022] });
    expect(weightedEbitdaCents([{ year: 2024, cents: -10 }, { year: 2023, cents: 50_000_00 }])).toEqual({
      cents: 50_000_00,
      years: [2023],
    });
  });

  it("t93: places a price on the bar", async () => {
    const { priceBarPosition, priceBarEnds } = await import("@/lib/valuation-multiples");
    const estimate = { lowCents: 400_000_00, highCents: 600_000_00 };
    expect(priceBarEnds(estimate)).toEqual({ minCents: 200_000_00, maxCents: 900_000_00 });
    expect(priceBarPosition(400_000_00, estimate)).toBeCloseTo(0.35);
    expect(priceBarPosition(500_000_00, estimate)).toBeCloseTo(0.5);
    expect(priceBarPosition(600_000_00, estimate)).toBeCloseTo(0.65);
    expect(priceBarPosition(0, estimate)).toBe(0);
    expect(priceBarPosition(10_000_000_00, estimate)).toBe(1);
    expect(priceBarPosition(300_000_00, estimate)).toBeCloseTo(0.175);
    expect(priceBarPosition(5, { lowCents: 0, highCents: 0 })).toBeGreaterThanOrEqual(0);
  });
});
