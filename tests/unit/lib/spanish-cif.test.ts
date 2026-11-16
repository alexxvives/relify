import { describe, expect, it } from "vitest";
import {
  isValidSpanishCif,
  isValidSpanishDni,
  isValidSpanishNie,
  isValidSpanishPersonId,
  isValidSpanishTaxId,
  maskNationalId,
  normalizeCif,
} from "@/lib/spanish-cif";

describe("isValidSpanishCif", () => {
  it("accepts a checksum and ignores spaces", () => {
    expect(normalizeCif(" a-00000000 ")).toBe("A00000000");
    expect(isValidSpanishCif("A00000000")).toBe(true);
    expect(isValidSpanishCif("a 00000000")).toBe(true);
  });

  it("rejects a bad control character and a personal-looking string", () => {
    expect(isValidSpanishCif("A00000001")).toBe(false);
    expect(isValidSpanishCif("12345678Z")).toBe(false);
    expect(isValidSpanishCif("")).toBe(false);
  });
});

describe("isValidSpanishTaxId", () => {
  it("accepts a DNI, a NIE, and a CIF, including a dash", () => {
    expect(isValidSpanishDni("12345678Z")).toBe(true);
    expect(isValidSpanishDni("12345678-z")).toBe(true);
    expect(isValidSpanishDni("12345678A")).toBe(false);
    expect(isValidSpanishNie("X0000000T")).toBe(true);
    expect(isValidSpanishNie("Y0000000Z")).toBe(true);
    expect(isValidSpanishNie("X0000000A")).toBe(false);
    expect(isValidSpanishTaxId("12345678Z")).toBe(true);
    expect(isValidSpanishTaxId("X0000000T")).toBe(true);
    expect(isValidSpanishTaxId("A00000000")).toBe(true);
    expect(isValidSpanishTaxId("12345678A")).toBe(false);
    expect(isValidSpanishPersonId("12345678Z")).toBe(true);
    expect(isValidSpanishPersonId("X0000000T")).toBe(true);
    expect(isValidSpanishPersonId("A00000000")).toBe(false);
  });
});

describe("maskNationalId", () => {
  it("keeps the last three characters and never returns the full id", () => {
    expect(maskNationalId("12345678Z")).toBe("••••••78Z");
    expect(maskNationalId("X0000000T")).toBe("••••••00T");
    expect(maskNationalId("12345678Z")).not.toContain("123456");
  });
});
