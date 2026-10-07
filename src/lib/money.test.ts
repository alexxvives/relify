import { describe, expect, it } from "vitest";
import { formatCompactEur, formatEur, formatRecoveryYears, formatWholeEur, recoveryTone, recoveryYears } from "./money";

describe("formatEur", () => {
  it("formats integer cents as euros in Spanish", () => {
    expect(formatEur(125_000_000)).toBe("1.250.000,00 €");
    expect(formatWholeEur(92_000_000)).toBe("920.000 €");
    expect(formatWholeEur(-150)).toBe("-2 €");
    expect(formatCompactEur(74_000_000)).toBe("740 mil €");
    expect(formatCompactEur(101_000_000)).toBe("1 M €");
  });
});

describe("recoveryYears", () => {
  it("colors a short payback green, a typical one orange, and a long one red", () => {
    expect(recoveryYears(400_000_00, 200_000_00)).toBe(2);
    expect(recoveryTone(2)).toBe("good");
    expect(recoveryTone(5)).toBe("average");
    expect(recoveryTone(8)).toBe("high");
    expect(formatRecoveryYears(4.25)).toBe("ROI de 4,3 años");
    expect(formatRecoveryYears(6.7)).toBe("ROI de 6,7 años");
    expect(recoveryYears(100, 0)).toBeNull();
  });
});
