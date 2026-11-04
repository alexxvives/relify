import { describe, expect, it } from "vitest";
import { sellerFinancingErrors, sellerFinancingText, sellerFinancingWrite, storedSellerFinancing } from "./seller-financing";

describe("seller financing", () => {
  it("accepts an unanswered question without errors", () => {
    expect(sellerFinancingErrors({ sellerFinancing: "", sellerFinancingPct: "", sellerFinancingYears: "" })).toEqual({});
    expect(sellerFinancingWrite({ sellerFinancing: "", sellerFinancingPct: "", sellerFinancingYears: "" })).toEqual({
      ok: true,
      data: { sellerFinancing: null, sellerFinancingMaxPct: null, sellerFinancingYears: null },
    });
  });

  it("requires share and term for Sí, keeps them optional for A negociar and drops them for No", () => {
    expect(Object.keys(sellerFinancingErrors({ sellerFinancing: "yes", sellerFinancingPct: "", sellerFinancingYears: "" }))).toEqual(["pct", "years"]);
    expect(sellerFinancingErrors({ sellerFinancing: "negotiable", sellerFinancingPct: "", sellerFinancingYears: "" })).toEqual({});
    expect(sellerFinancingErrors({ sellerFinancing: "yes", sellerFinancingPct: "101", sellerFinancingYears: "3" }).pct).toBeTruthy();
    expect(sellerFinancingErrors({ sellerFinancing: "yes", sellerFinancingPct: "20", sellerFinancingYears: "9" }).years).toBeTruthy();
    expect(sellerFinancingWrite({ sellerFinancing: "no", sellerFinancingPct: "20", sellerFinancingYears: "3" })).toEqual({
      ok: true,
      data: { sellerFinancing: "no", sellerFinancingMaxPct: null, sellerFinancingYears: null },
    });
  });

  it("describes the terms for a buyer", () => {
    expect(sellerFinancingText({ mode: "yes", maxPct: 20, years: 3 })).toBe("Acepta financiar hasta un 20 % a 3 años");
    expect(sellerFinancingText({ mode: "yes", maxPct: 30, years: 5 })).toBe("Acepta financiar hasta un 30 % a 5 años o más");
    expect(sellerFinancingText({ mode: "negotiable", maxPct: null, years: null })).toBe("A negociar");
    expect(sellerFinancingText({ mode: "no", maxPct: null, years: null })).toBe("No");
    expect(storedSellerFinancing({ sellerFinancing: "maybe" })).toBeNull();
    expect(storedSellerFinancing({ sellerFinancing: "no", sellerFinancingMaxPct: 10, sellerFinancingYears: 2 })).toEqual({ mode: "no", maxPct: null, years: null });
  });
});
