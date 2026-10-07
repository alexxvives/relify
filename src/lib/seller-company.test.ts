import { describe, expect, it } from "vitest";
import { pickSellerProjectId, sellerCompanyLabel } from "./seller-company";

describe("pickSellerProjectId", () => {
  it("keeps the chosen company when it belongs to the seller", () => {
    expect(pickSellerProjectId(["a", "b"], "a")).toBe("a");
  });

  it("falls back to the newest company", () => {
    expect(pickSellerProjectId(["a", "b"], "other")).toBe("b");
    expect(pickSellerProjectId(["a"], undefined)).toBe("a");
    expect(pickSellerProjectId([], "a")).toBeNull();
  });
});

describe("sellerCompanyLabel", () => {
  it("uses the legal name and a fallback when the company is still blank", () => {
    expect(sellerCompanyLabel("Obrador Norte", "Nueva empresa")).toBe("Obrador Norte");
    expect(sellerCompanyLabel("  ", "Nueva empresa")).toBe("Nueva empresa");
  });
});
