import { describe, expect, it } from "vitest";
import { formatEur } from "./money";
import { figureVeilBalance, figureVeilCents, figureVeilChartIncome, figureVeilIncome } from "./figure-veil";

describe("figure veil", () => {
  it("prints 999.999,00 € and no other amount", () => {
    expect(formatEur(figureVeilCents)).toBe("999.999,00 €");
    const amounts = [...figureVeilIncome().rows, ...figureVeilBalance().rows].flatMap((row) => row.values);
    expect(new Set(amounts)).toEqual(new Set([figureVeilCents]));
    const sales = figureVeilChartIncome().rows.find((row) => row.key === "sales")?.values ?? [];
    expect(new Set(sales).size).toBeGreaterThan(1);
    expect(sales.every((value) => value !== figureVeilCents)).toBe(true);
  });
});
