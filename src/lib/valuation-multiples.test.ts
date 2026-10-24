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
});
