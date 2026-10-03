import { describe, expect, it } from "vitest";
import { formatEur } from "./money";

describe("formatEur", () => {
  it("formats integer cents as euros in Spanish", () => {
    const formatted = formatEur(125_000_000).replaceAll("\u00a0", " ").replaceAll("\u202f", " ");
    expect(formatted).toBe("1.250.000,00 €");
  });
});
