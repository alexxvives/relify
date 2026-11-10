import { describe, expect, it } from "vitest";
import { sellerFinancingText, sellerFinancingWrite, storedSellerFinancing } from "./seller-financing";

describe("seller financing", () => {
  it("accepts an unanswered question without errors", () => {
    expect(sellerFinancingWrite({ sellerFinancing: "", sellerFinancingPct: "", sellerFinancingYears: "" })).toEqual({
      ok: true,
      data: { sellerFinancing: null, sellerFinancingMaxPct: null, sellerFinancingYears: null },
    });
  });

  it("maps leftover Negociable to Sí and drops terms for No", () => {
    expect(sellerFinancingWrite({ sellerFinancing: "negotiable", sellerFinancingPct: "20", sellerFinancingYears: "3" })).toEqual({
      ok: true,
      data: { sellerFinancing: "yes", sellerFinancingMaxPct: 20, sellerFinancingYears: 3 },
    });
    expect(sellerFinancingWrite({ sellerFinancing: "no", sellerFinancingPct: "20", sellerFinancingYears: "3" })).toEqual({
      ok: true,
      data: { sellerFinancing: "no", sellerFinancingMaxPct: null, sellerFinancingYears: null },
    });
  });

  it("describes the terms for a buyer", () => {
    expect(sellerFinancingText({ mode: "yes", maxPct: 20, years: 3 })).toBe("Acepta financiar parte del precio (hasta el 20 %, 3 años)");
    expect(sellerFinancingText({ mode: "yes", maxPct: 30, years: 5 })).toBe("Acepta financiar parte del precio (hasta el 30 %, 5 años o más)");
    expect(sellerFinancingText({ mode: "no", maxPct: null, years: null })).toBe("No");
    expect(storedSellerFinancing({ sellerFinancing: "maybe" })).toBeNull();
    expect(storedSellerFinancing({ sellerFinancing: "negotiable", sellerFinancingMaxPct: 20, sellerFinancingYears: 3 })).toEqual({
      mode: "yes",
      maxPct: 20,
      years: 3,
    });
    expect(storedSellerFinancing({ sellerFinancing: "no", sellerFinancingMaxPct: 10, sellerFinancingYears: 2 })).toEqual({ mode: "no", maxPct: null, years: null });
  });
});

describe("sellerFinancingChip (t92)", () => {
  it("shows only for Sí", async () => {
    const { sellerFinancingChip } = await import("./seller-financing");
    expect(sellerFinancingChip(null)).toBeNull();
    expect(sellerFinancingChip({ mode: "no", maxPct: null, years: null })).toBeNull();
    expect(sellerFinancingChip({ mode: "yes", maxPct: 20, years: 3 })).toBe("Financiación vendedor");
  });
});
