import { describe, expect, it } from "vitest";
import { veilYears } from "./report-veil";
import { figureVeilYears } from "./figure-veil";

describe("veilYears (t91)", () => {
  it("keeps the shape (years, nulls, ratio keys) and never the real figures", () => {
    const real = { ...figureVeilYears()[0]!, year: 2024, revenueCents: 123_456, ebitdaCents: null, ratios: { roa: 3.3 } };
    const [fake] = veilYears([real]);
    expect(fake!.year).toBe(2024);
    expect(fake!.ebitdaCents).toBeNull();
    expect(fake!.revenueCents).not.toBe(123_456);
    expect(Object.keys(fake!.ratios)).toEqual(["roa"]);
    expect(fake!.ratios.roa).not.toBe(3.3);
  });
});
