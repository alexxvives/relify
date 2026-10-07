export const headcountRanges = ["band_1_5", "band_6_10", "band_11_20", "band_21_50", "band_over_50"] as const;

export type HeadcountRangeId = (typeof headcountRanges)[number];

export const headcountLabels: Record<HeadcountRangeId, string> = {
  band_1_5: "1-5",
  band_6_10: "6-10",
  band_11_20: "11-20",
  band_21_50: "21-50",
  band_over_50: "+50",
};

export const customerBases = ["business", "consumer", "mixed"] as const;

export type CustomerBaseId = (typeof customerBases)[number];

export function isCustomerBase(value: string): value is CustomerBaseId {
  return customerBases.some((item) => item === value);
}

export const sliceKinds = ["capital", "product", "client"] as const;

export type SliceKind = (typeof sliceKinds)[number];

export function activityKindsForCustomer(customerBase: CustomerBaseId | "" | null): SliceKind[] {
  if (customerBase === "consumer") {
    return ["capital", "product"];
  }

  return ["capital", "product", "client"];
}

export const maxSecondaryCnaes = 4;
export const maxActivitySlices = 8;
export const descriptionMaxLength = 4000;
export const foundedYearMin = 1800;
export const statementYearMin = 1990;
export const statementYearMax = 2100;
export const statementHistoryCount = 3;
/** Most Spanish SMEs close the exercise on 31 December. */
export const defaultFiscalCloseMonth = 12;

export const pnlInputKeys = [
  "sales",
  "inventoryChange",
  "ownUse",
  "supplies",
  "otherOperatingIncome",
  "staffCosts",
  "otherOperatingCosts",
  "grantIncome",
  "provisionSurplus",
  "assetImpairment",
  "subsidiaryControlLoss",
  "negativeDifference",
  "otherResults",
  "amortization",
] as const;

export type PnlInputKey = (typeof pnlInputKeys)[number];

export const balanceInputKeys = [
  "currentAssets",
  "cash",
  "nonCurrentAssets",
  "currentLiabilities",
  "longTermDebt",
  "nonCurrentLiabilities",
  "shortTermDebt",
  "equity",
] as const;

export type BalanceInputKey = (typeof balanceInputKeys)[number];

export const incomeDisplayKeys = [
  "sales",
  "inventoryChange",
  "ownUse",
  "supplies",
  "otherOperatingIncome",
  "grossMargin",
  "staffCosts",
  "otherOperatingCosts",
  "grantIncome",
  "provisionSurplus",
  "assetImpairment",
  "subsidiaryControlLoss",
  "negativeDifference",
  "otherResults",
  "ebitda",
  "amortization",
  "operatingResult",
] as const;

export type IncomeDisplayKey = (typeof incomeDisplayKeys)[number];

export const balanceDisplayKeys = [
  "currentAssets",
  "cash",
  "nonCurrentAssets",
  "totalAssets",
  "currentLiabilities",
  "longTermDebt",
  "nonCurrentLiabilities",
  "shortTermDebt",
  "equity",
  "totalLiabilities",
] as const;

export type BalanceDisplayKey = (typeof balanceDisplayKeys)[number];

const grossMarginKeys = ["sales", "inventoryChange", "ownUse", "supplies", "otherOperatingIncome"] as const;

const ebitdaExtraKeys = [
  "staffCosts",
  "otherOperatingCosts",
  "grantIncome",
  "provisionSurplus",
  "assetImpairment",
  "subsidiaryControlLoss",
  "negativeDifference",
  "otherResults",
] as const;

export type PnlAmounts = Record<PnlInputKey, number | null>;

export type BalanceAmounts = Record<BalanceInputKey, number | null>;

const sliceSingular: Record<SliceKind, string> = {
  capital: "Accionista",
  product: "Producto",
  client: "Cliente",
};

const slicePlural: Record<SliceKind, string> = {
  capital: "Accionistas",
  product: "Productos",
  client: "Clientes",
};

export function isHeadcountRange(value: string): value is HeadcountRangeId {
  return headcountRanges.some((item) => item === value);
}

export function currentCalendarYear(): number {
  return new Date().getFullYear();
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function lastCompletedStatementYear(today: Date, closeMonth = defaultFiscalCloseMonth): number {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  if (month > closeMonth || (month === closeMonth && today.getDate() >= lastDayOfMonth(year, closeMonth))) {
    return year;
  }

  return year - 1;
}

export function statementWindow(
  today: Date,
  closeMonth = defaultFiscalCloseMonth,
): { closed: [number, number, number]; forecast: number } {
  const last = lastCompletedStatementYear(today, closeMonth);
  return {
    closed: [last - 2, last - 1, last],
    forecast: last + 1,
  };
}

export function statementYearIsBeforeFounding(yearText: string, foundedYearText: string): boolean {
  if (!/^\d{4}$/.test(yearText) || !/^\d{4}$/.test(foundedYearText)) {
    return false;
  }

  return Number(yearText) < Number(foundedYearText);
}

export function isFoundedYear(value: number): boolean {
  return Number.isInteger(value) && value >= foundedYearMin && value <= currentCalendarYear();
}

export function isStatementYear(value: number): boolean {
  return Number.isInteger(value) && value >= statementYearMin && value <= statementYearMax;
}

export function sumNullable(values: Array<number | null>): number | null {
  let total = 0;

  for (const value of values) {
    if (value === null) {
      return null;
    }

    total += value;
  }

  return total;
}

export function grossMargin(amounts: PnlAmounts): number | null {
  return sumNullable(grossMarginKeys.map((key) => amounts[key]));
}

export function statementEbitda(amounts: PnlAmounts): number | null {
  const margin = grossMargin(amounts);
  const rest = sumNullable(ebitdaExtraKeys.map((key) => amounts[key]));

  if (margin === null || rest === null) {
    return null;
  }

  return margin + rest;
}

export function operatingResult(amounts: PnlAmounts): number | null {
  const ebitda = statementEbitda(amounts);

  if (ebitda === null || amounts.amortization === null) {
    return null;
  }

  return ebitda + amounts.amortization;
}

export function totalAssets(amounts: BalanceAmounts): number | null {
  return sumNullable([amounts.currentAssets, amounts.nonCurrentAssets]);
}

export function totalLiabilities(amounts: BalanceAmounts): number | null {
  return sumNullable([amounts.currentLiabilities, amounts.nonCurrentLiabilities, amounts.equity]);
}

export function incomeValue(key: IncomeDisplayKey, amounts: PnlAmounts): number | null {
  if (key === "grossMargin") {
    return grossMargin(amounts);
  }

  if (key === "ebitda") {
    return statementEbitda(amounts);
  }

  if (key === "operatingResult") {
    return operatingResult(amounts);
  }

  return amounts[key];
}

export function balanceValue(key: BalanceDisplayKey, amounts: BalanceAmounts): number | null {
  if (key === "totalAssets") {
    return totalAssets(amounts);
  }

  if (key === "totalLiabilities") {
    return totalLiabilities(amounts);
  }

  return amounts[key];
}

export function isEmphasisRow(key: IncomeDisplayKey | BalanceDisplayKey): boolean {
  return (
    key === "grossMargin" ||
    key === "ebitda" ||
    key === "operatingResult" ||
    key === "totalAssets" ||
    key === "totalLiabilities"
  );
}

export function ebitdaMarginBasisPoints(ebitdaCents: number, revenueCents: number): number | null {
  if (revenueCents === 0) {
    return null;
  }

  return Math.round((ebitdaCents * 10_000) / revenueCents);
}

export function parsePercentToBasisPoints(value: string): number | null {
  if (!/^\d{1,3}(,\d{1,2})?$/.test(value)) {
    return null;
  }

  const [whole = "0", fraction = ""] = value.split(",");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));

  if (basisPoints <= 0 || basisPoints > 10_000) {
    return null;
  }

  return basisPoints;
}

export function basisPointsToPercentInput(basisPoints: number): string {
  const whole = Math.trunc(basisPoints / 100);
  const fraction = Math.abs(basisPoints % 100);

  if (fraction === 0) {
    return String(whole);
  }

  if (fraction % 10 === 0) {
    return `${whole},${fraction / 10}`;
  }

  return `${whole},${String(fraction).padStart(2, "0")}`;
}

export function formatBasisPoints(basisPoints: number): string {
  const negative = basisPoints < 0;
  const body = basisPointsToPercentInput(Math.abs(basisPoints));
  return `${negative ? "-" : ""}${body}%`;
}

export function anonymousSliceLabel(kind: SliceKind, position: number): string {
  return `${sliceSingular[kind]} ${position}`;
}

export function sliceCenterNoun(kind: SliceKind, count: number): string {
  return count === 1 ? sliceSingular[kind] : slicePlural[kind];
}

export function percentsSumToHundred(basisPoints: number[]): boolean {
  return basisPoints.reduce((total, value) => total + value, 0) === 10_000;
}

export function slicePercentIssue(values: string[]): "ok" | "over" | "short" {
  const filled = values.map((value) => value.trim()).filter((value) => value.length > 0);

  if (filled.length === 0) {
    return "ok";
  }

  const parsed: number[] = [];

  for (const value of filled) {
    const points = parsePercentToBasisPoints(value);

    if (points === null) {
      return "short";
    }

    parsed.push(points);
  }

  const total = parsed.reduce((sum, value) => sum + value, 0);

  if (total > 10_000) {
    return "over";
  }

  if (total !== 10_000) {
    return "short";
  }

  return "ok";
}

export const sellerFocusPanels = ["identity", "description", "cnae", "income", "balance", "structure", "price"] as const;

export type SellerFocusPanel = (typeof sellerFocusPanels)[number];

export type SellerPanelFlags = {
  identity: boolean;
  description: boolean;
  cnae: boolean;
  income: boolean;
  balance: boolean;
  structure: boolean;
  price: boolean;
};

export function isSellerFocusPanel(value: string): value is SellerFocusPanel {
  return sellerFocusPanels.some((panel) => panel === value);
}

export function sellerPanelFlags(input: {
  legalName: string;
  cif: string;
  description: string;
  principalCnae: string;
  closedYears: { sales: string; currentAssets: string; equity: string }[];
  headcount: string;
  capitalPercents: string[];
  askingPrice: string;
}): SellerPanelFlags {
  return {
    identity: input.legalName.trim().length > 0 && input.cif.trim().length > 0,
    description: input.description.trim().length > 0,
    cnae: input.principalCnae.trim().length > 0,
    income: input.closedYears.some((year) => year.sales.trim().length > 0),
    balance: input.closedYears.some((year) => year.currentAssets.trim().length > 0 || year.equity.trim().length > 0),
    structure: input.headcount.trim().length > 0 || input.capitalPercents.some((value) => value.trim().length > 0),
    price: input.askingPrice.trim().length > 0,
  };
}

export function filledSellerPanels(flags: SellerPanelFlags): number {
  return Object.values(flags).filter(Boolean).length;
}

export function descriptionContainsSecret(description: string, secrets: string[]): boolean {
  const haystack = description.toLocaleLowerCase("es-ES");

  return secrets.some((secret) => {
    const needle = secret.trim().toLocaleLowerCase("es-ES");
    return needle.length > 0 && haystack.includes(needle);
  });
}
