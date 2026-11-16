import { describe, expect, it } from "vitest";
import { activeSellerChoice, pickSellerProjectId, sellerCompanyLabel } from "@/lib/seller-company";

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

describe("activeSellerChoice", () => {
  const companies = [
    { id: "named", cif: "B12345674" },
    { id: "blank", cif: "" },
  ];

  it("ignores a company that has no CIF when another company is ready", () => {
    expect(activeSellerChoice(companies, "blank")).toBe("named");
    expect(activeSellerChoice(companies, undefined)).toBe("named");
  });

  it("keeps the only company while its CIF is still empty", () => {
    expect(activeSellerChoice([{ id: "blank", cif: " " }], undefined)).toBe("blank");
  });
});

describe("sellerCompanyLabel", () => {
  it("uses the legal name and a fallback when the company is still blank", () => {
    expect(sellerCompanyLabel("Obrador Norte", "Nueva empresa")).toBe("Obrador Norte");
    expect(sellerCompanyLabel("  ", "Nueva empresa")).toBe("Nueva empresa");
  });
});
