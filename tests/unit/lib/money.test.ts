import { describe, expect, it } from "vitest";
import { formatCardEur, formatCompactEur, formatEur, formatRecoveryYears, formatWholeEur, recoveryTone, recoveryYears } from "@/lib/money";

describe("formatEur", () => {
  it("formats integer cents as euros in Spanish", () => {
    expect(formatEur(125_000_000)).toBe("1.250.000,00 €");
    expect(formatWholeEur(92_000_000)).toBe("920.000 €");
    expect(formatWholeEur(-150)).toBe("-2 €");
    expect(formatCompactEur(74_000_000)).toBe("740 mil €");
    expect(formatCompactEur(101_000_000)).toBe("1 M €");
  });
});

describe("formatCardEur", () => {
  it("uses 2 decimals below 10 of the unit, 1 from 10–100, 0 above, with a space before K/M", () => {
    expect(formatCardEur(165_000_000)).toBe("1,65 M €");
    expect(formatCardEur(170_000_000)).toBe("1,7 M €");
    expect(formatCardEur(1_250_000_000)).toBe("12,5 M €");
    expect(formatCardEur(12_000_000_000)).toBe("120 M €");
    expect(formatCardEur(5_740_000)).toBe("57,4 K €");
    expect(formatCardEur(-36_400_000)).toBe("-364 K €");
    expect(formatCardEur(85_000)).toBe("850 €");
  });
});

describe("recoveryYears", () => {
  it("colors a short payback green, a typical one orange, and a long one red", () => {
    expect(recoveryYears(400_000_00, 200_000_00)).toBe(2);
    expect(recoveryTone(2)).toBe("good");
    expect(recoveryTone(5)).toBe("average");
    expect(recoveryTone(8)).toBe("high");
    expect(formatRecoveryYears(4.25)).toBe("Recuperas la inversión en ~4,3 años");
    expect(formatRecoveryYears(6.7)).toBe("Recuperas la inversión en ~6,7 años");
    expect(recoveryYears(100, 0)).toBeNull();
  });
});
