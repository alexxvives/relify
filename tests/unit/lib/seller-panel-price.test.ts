import { describe, expect, it } from "vitest";
import { sellerPanelFlags } from "@/lib/company-profile";

const base = { legalName: "", cif: "", description: "", principalCnae: "", closedYears: [], headcount: "", capitalPercents: [] };

describe("sellerPanelFlags price", () => {
  it("treats a stored 0 as no price", () => {
    expect(sellerPanelFlags({ ...base, askingPrice: "0" }).price).toBe(false);
    expect(sellerPanelFlags({ ...base, askingPrice: "950000" }).price).toBe(true);
  });
});
