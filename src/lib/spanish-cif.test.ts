import { describe, expect, it } from "vitest";
import { isValidSpanishCif, normalizeCif } from "./spanish-cif";

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
