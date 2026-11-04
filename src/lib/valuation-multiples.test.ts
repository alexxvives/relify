import { describe, expect, it } from "vitest";
import { estimatePriceRange, priceStanding, valuationSectorFromCnae } from "./valuation-multiples";

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
  it("t93: adjusts for the EBITDA trend and handles missing growth", async () => {
    const { estimatePriceRange } = await import("./valuation-multiples");
    const base = estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00 });
    const up = estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00, ebitdaGrowth: 0.2 });
    const down = estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00, ebitdaGrowth: -0.3 });
    const flat = estimatePriceRange({ cnae: "7490", ebitdaCents: 100_000_00, ebitdaGrowth: 0.02, revenueGrowth: null });
    expect(up!.multipleLow).toBe(base!.multipleLow + 0.25);
    expect(up!.adjustments).toContain("EBITDA en crecimiento (+)");
    expect(down!.multipleLow).toBe(base!.multipleLow - 0.25);
    expect(flat).toEqual(base);
    expect(estimatePriceRange({ cnae: null, ebitdaCents: null, ebitdaGrowth: 0.5 })).toBeNull();
    expect(estimatePriceRange({ cnae: "", ebitdaCents: 50_000_00, ebitdaGrowth: Number.NaN })!.sector).toBe("servicios");
  });

  it("t93: places a price on the bar", async () => {
    const { priceBarPosition, priceBarEnds } = await import("./valuation-multiples");
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
