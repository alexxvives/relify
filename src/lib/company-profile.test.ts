import { describe, expect, it } from "vitest";
import {
  balanceValue,
  descriptionContainsSecret,
  ebitdaMarginBasisPoints,
  formatBasisPoints,
  grossMargin,
  incomeValue,
  operatingResult,
  parsePercentToBasisPoints,
  percentsSumToHundred,
  statementEbitda,
  totalAssets,
  totalLiabilities,
  anonymousSliceLabel,
  type BalanceAmounts,
  type PnlAmounts,
} from "./company-profile";

const pnl: PnlAmounts = {
  sales: 100,
  inventoryChange: 10,
  ownUse: 5,
  supplies: -40,
  otherOperatingIncome: 5,
  staffCosts: -20,
  otherOperatingCosts: -10,
  grantIncome: 4,
  provisionSurplus: 1,
  assetImpairment: -2,
  subsidiaryControlLoss: 0,
  negativeDifference: 0,
  otherResults: 2,
  amortization: -5,
};

const balance: BalanceAmounts = {
  currentAssets: 100,
  cash: 10,
  nonCurrentAssets: 50,
  currentLiabilities: 40,
  longTermDebt: 12,
  nonCurrentLiabilities: 30,
  shortTermDebt: 8,
  equity: 80,
};

describe("company profile statements", () => {
  it("computes margins and leaves a gap when an input is missing", () => {
    expect(grossMargin(pnl)).toBe(80);
    expect(statementEbitda(pnl)).toBe(55);
    expect(operatingResult(pnl)).toBe(50);
    expect(incomeValue("ebitda", { ...pnl, staffCosts: null })).toBeNull();
    expect(incomeValue("grossMargin", { ...pnl, staffCosts: null })).toBe(80);
    expect(totalAssets(balance)).toBe(150);
    expect(totalLiabilities(balance)).toBe(150);
    expect(balanceValue("cash", balance)).toBe(10);
  });

  it("formats percentages and anonymous labels", () => {
    expect(parsePercentToBasisPoints("33,33")).toBe(3333);
    expect(parsePercentToBasisPoints("40,5")).toBe(4050);
    expect(percentsSumToHundred([3334, 3333, 3333])).toBe(true);
    expect(formatBasisPoints(10_000)).toBe("100%");
    expect(formatBasisPoints(3333)).toBe("33,33%");
    expect(formatBasisPoints(190)).toBe("1,9%");
    expect(ebitdaMarginBasisPoints(31_000_000, 125_000_000)).toBe(2480);
    expect(ebitdaMarginBasisPoints(10, 0)).toBeNull();
    expect(anonymousSliceLabel("capital", 1)).toBe("Accionista 1");
    expect(anonymousSliceLabel("client", 2)).toBe("Cliente 2");
  });

  it("detects private text inside an investor description", () => {
    expect(descriptionContainsSecret("Mayorista de bebidas", ["Talleres Olivo SL", ""])).toBe(false);
    expect(descriptionContainsSecret("La sociedad Talleres Olivo SL vende", ["Talleres Olivo SL"])).toBe(true);
    expect(descriptionContainsSecret("CIF b12345678", ["B12345678"])).toBe(true);
  });
});
