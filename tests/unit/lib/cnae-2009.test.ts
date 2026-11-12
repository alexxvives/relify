import { describe, expect, it } from "vitest";
import { canonicalCnaeCode, cnaeCardFields, cnaeDisplayTitle, cnaeTitle, formatCnaeCode, isCnaeCode } from "@/lib/cnae-2009";

describe("canonicalCnaeCode", () => {
  it("looks up dotted catalog codes and SABI four-digit codes", () => {
    expect(canonicalCnaeCode("62.01")).toBe("62.01");
    expect(canonicalCnaeCode("6201")).toBe("62.01");
    expect(canonicalCnaeCode(" 74.90 ")).toBe("74.90");
    expect(canonicalCnaeCode("7490")).toBe("74.90");
    expect(canonicalCnaeCode("7022")).toBe("70.22");
    expect(canonicalCnaeCode("9999")).toBeNull();
  });
});

describe("cnaeTitle", () => {
  it("returns the catalog description for dotted and undotted codes", () => {
    expect(cnaeTitle("62.01")).toBe("Actividades de programación informática");
    expect(cnaeTitle("6201")).toBe("Actividades de programación informática");
    expect(cnaeTitle("7022")).toBe("Otras actividades de consultoría de gestión empresarial");
    expect(cnaeTitle("9999")).toBeNull();
  });
});

describe("cnaeCardFields", () => {
  it("always shows a formatted code plus a description or fallback", () => {
    expect(cnaeCardFields("6201")).toEqual({
      cnaeCode: "62.01",
      cnaeTitle: "Actividades de programación informática",
    });
    expect(cnaeCardFields("9999", "tecnología y software")).toEqual({
      cnaeCode: "99.99",
      cnaeTitle: "tecnología y software",
    });
    expect(cnaeDisplayTitle("no-such")).toBe("Actividad CNAE no-such");
    expect(isCnaeCode("6201")).toBe(true);
    expect(formatCnaeCode("6201")).toBe("62.01");
  });
});
