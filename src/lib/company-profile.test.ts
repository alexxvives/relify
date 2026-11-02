import { describe, expect, it } from "vitest";
import {
  balanceValue,
  descriptionContainsSecret,
  ebitdaMarginBasisPoints,
  filledSellerPanels,
  formatBasisPoints,
  grossMargin,
  sellerPanelFlags,
  incomeValue,
  operatingResult,
  parsePercentToBasisPoints,
  percentsSumToHundred,
  slicePercentIssue,
  statementWindow,
  statementYearIsBeforeFounding,
  statementEbitda,
  totalAssets,
  totalLiabilities,
  activityKindsForCustomer,
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
    expect(slicePercentIssue([])).toBe("ok");
    expect(slicePercentIssue(["60", "40"])).toBe("ok");
    expect(slicePercentIssue(["60", "50"])).toBe("over");
    expect(slicePercentIssue(["60"])).toBe("short");
  });

  it("keeps three closed years and puts the open exercise in the forecast", () => {
    expect(statementWindow(new Date("2026-10-06T12:00:00"))).toEqual({
      closed: [2023, 2024, 2025],
      forecast: 2026,
    });
    expect(statementWindow(new Date("2027-01-15T12:00:00"))).toEqual({
      closed: [2024, 2025, 2026],
      forecast: 2027,
    });
    expect(statementWindow(new Date("2026-06-30T12:00:00"), 6)).toEqual({
      closed: [2024, 2025, 2026],
      forecast: 2027,
    });
    expect(statementWindow(new Date("2026-06-29T12:00:00"), 6)).toEqual({
      closed: [2023, 2024, 2025],
      forecast: 2026,
    });
    expect(statementYearIsBeforeFounding("2023", "2024")).toBe(true);
    expect(statementYearIsBeforeFounding("2024", "2024")).toBe(false);
    expect(statementYearIsBeforeFounding("2024", "")).toBe(false);
  });

  it("counts the seven seller panels from the same fields as the draft", () => {
    const empty = sellerPanelFlags({
      legalName: " ",
      cif: "",
      description: "",
      principalCnae: "",
      closedYears: [{ sales: "", currentAssets: "", equity: "" }],
      headcount: "",
      capitalPercents: [" "],
      askingPrice: "",
    });
    expect(filledSellerPanels(empty)).toBe(0);
    expect(
      filledSellerPanels(
        sellerPanelFlags({
          legalName: "Horno",
          cif: "B00000000",
          description: "Obrador",
          principalCnae: "10.71",
          closedYears: [{ sales: "1", currentAssets: "1", equity: "" }],
          headcount: "6-10",
          capitalPercents: [],
          askingPrice: "10",
        }),
      ),
    ).toBe(7);
  });

  it("hides client slices on the seller home when sales go only to consumers", () => {
    expect(activityKindsForCustomer("consumer")).toEqual(["capital", "product"]);
    expect(activityKindsForCustomer("business")).toEqual(["capital", "product", "client"]);
    expect(activityKindsForCustomer("mixed")).toEqual(["capital", "product", "client"]);
    expect(activityKindsForCustomer(null)).toEqual(["capital", "product", "client"]);
  });

  it("detects private text inside an investor description", () => {
    expect(descriptionContainsSecret("Mayorista de bebidas", ["Talleres Olivo SL", ""])).toBe(false);
    expect(descriptionContainsSecret("La sociedad Talleres Olivo SL vende", ["Talleres Olivo SL"])).toBe(true);
    expect(descriptionContainsSecret("CIF b12345678", ["B12345678"])).toBe(true);
  });
});
