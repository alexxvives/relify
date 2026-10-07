import { cnaeTitle } from "./cnae-2009";
import { balanceLabels, incomeLabels } from "./company-copy";
import { eurosToCents, optionalEurosToCents, projectSlug, type CompanyDraftInput } from "./company-draft";
import {
  anonymousSliceLabel,
  balanceDisplayKeys,
  balanceValue,
  ebitdaMarginBasisPoints,
  incomeDisplayKeys,
  incomeValue,
  isEmphasisRow,
  isFoundedYear,
  isHeadcountRange,
  isStatementYear,
  parsePercentToBasisPoints,
  type BalanceAmounts,
  type PnlAmounts,
  type SliceKind,
} from "./company-profile";
import type { InvestorProjectProfile, InvestorSlice, InvestorYearColumn } from "./investor-project";

const signedEuroPattern = /^-?\d{1,12}(,\d{1,2})?$/;
const unsignedEuroPattern = /^\d{1,12}(,\d{1,2})?$/;

function unsignedCents(value: string): number {
  const trimmed = value.trim();
  if (!unsignedEuroPattern.test(trimmed)) {
    return 0;
  }

  return eurosToCents(trimmed);
}

function optionalUnsignedCents(value: string): number | null {
  const trimmed = value.trim();
  if (!unsignedEuroPattern.test(trimmed)) {
    return null;
  }

  return optionalEurosToCents(trimmed);
}

function signedCents(value: string): number | null {
  const trimmed = value.trim();
  if (!signedEuroPattern.test(trimmed)) {
    return null;
  }

  return eurosToCents(trimmed);
}

function pnlFrom(year: CompanyDraftInput["forecastYear"]): PnlAmounts {
  return {
    sales: signedCents(year.sales),
    inventoryChange: signedCents(year.inventoryChange),
    ownUse: signedCents(year.ownUse),
    supplies: signedCents(year.supplies),
    otherOperatingIncome: signedCents(year.otherOperatingIncome),
    staffCosts: signedCents(year.staffCosts),
    otherOperatingCosts: signedCents(year.otherOperatingCosts),
    grantIncome: signedCents(year.grantIncome),
    provisionSurplus: signedCents(year.provisionSurplus),
    assetImpairment: signedCents(year.assetImpairment),
    subsidiaryControlLoss: signedCents(year.subsidiaryControlLoss),
    negativeDifference: signedCents(year.negativeDifference),
    otherResults: signedCents(year.otherResults),
    amortization: signedCents(year.amortization),
  };
}

function balanceFrom(year: CompanyDraftInput["closedYears"][number]): BalanceAmounts {
  return {
    currentAssets: signedCents(year.currentAssets),
    cash: signedCents(year.cash),
    nonCurrentAssets: signedCents(year.nonCurrentAssets),
    currentLiabilities: signedCents(year.currentLiabilities),
    longTermDebt: signedCents(year.longTermDebt),
    nonCurrentLiabilities: signedCents(year.nonCurrentLiabilities),
    shortTermDebt: signedCents(year.shortTermDebt),
    equity: signedCents(year.equity),
  };
}

function slicesFor(kind: SliceKind, values: string[]): InvestorSlice[] {
  return values.flatMap((value, index) => {
    const basisPoints = parsePercentToBasisPoints(value.trim());
    if (basisPoints === null) {
      return [];
    }

    return [{ label: anonymousSliceLabel(kind, index + 1), basisPoints }];
  });
}

function yearNumber(value: string): number | null {
  if (!/^\d{4}$/.test(value)) {
    return null;
  }

  const year = Number(value);
  return isStatementYear(year) ? year : null;
}

export function draftInvestorPreview(input: CompanyDraftInput): InvestorProjectProfile {
  const revenueCents = unsignedCents(input.revenue);
  const ebitdaCents = unsignedCents(input.ebitda);
  const incomeSource = [
    ...input.closedYears.map((year) => ({ year: yearNumber(year.year), forecast: false, amounts: pnlFrom(year) })),
    { year: yearNumber(input.forecastYear.year), forecast: true, amounts: pnlFrom(input.forecastYear) },
  ].filter((column): column is { year: number; forecast: boolean; amounts: PnlAmounts } => column.year !== null);
  const balanceSource = input.closedYears.flatMap((year) => {
    const number = yearNumber(year.year);
    return number === null ? [] : [{ year: number, amounts: balanceFrom(year) }];
  });
  const incomeYears: InvestorYearColumn[] = incomeSource.map((column) => ({ year: column.year, forecast: column.forecast }));
  const principal = input.principalCnae.trim();
  const principalTitle = cnaeTitle(principal);
  const description = input.description.trim();
  const founded = /^\d{4}$/.test(input.foundedYear) ? Number(input.foundedYear) : null;

  return {
    slug: projectSlug(input.codename),
    codename: input.codename.trim(),
    region: input.region.trim(),
    foundedYear: founded !== null && isFoundedYear(founded) ? founded : null,
    description: description.length > 0 ? description : null,
    revenueCents,
    ebitdaCents,
    adjustedEbitdaCents: unsignedCents(input.adjustedEbitda),
    askingPriceCents: unsignedCents(input.askingPrice),
    opexCents: optionalUnsignedCents(input.opex),
    ebitdaMarginBp: ebitdaMarginBasisPoints(ebitdaCents, revenueCents),
    principalCnae: principalTitle ? { code: principal, title: principalTitle } : null,
    secondaryCnaes: input.secondaryCnaes.flatMap((code) => {
      const trimmed = code.trim();
      const title = cnaeTitle(trimmed);
      return title ? [{ code: trimmed, title }] : [];
    }),
    capital: slicesFor("capital", input.capitalPercents),
    products: slicesFor("product", input.productPercents),
    clients: slicesFor("client", input.clientPercents),
    customerBase: input.customerBase === "" ? null : input.customerBase,
    headcountRange: input.headcount !== "" && isHeadcountRange(input.headcount) ? input.headcount : null,
    incomeYears,
    incomeRows: incomeDisplayKeys.map((key) => ({
      key,
      label: incomeLabels[key],
      emphasis: isEmphasisRow(key),
      values: incomeSource.map((column) => incomeValue(key, column.amounts)),
    })),
    balanceYears: balanceSource.map((column) => ({ year: column.year, forecast: false })),
    balanceRows: balanceDisplayKeys.map((key) => ({
      key,
      label: balanceLabels[key],
      emphasis: isEmphasisRow(key),
      values: balanceSource.map((column) => balanceValue(key, column.amounts)),
    })),
  };
}
