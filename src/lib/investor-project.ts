import type { Prisma } from "@/generated/prisma/client";
import { cnaeTitle } from "./cnae-2009";
import { balanceLabels, incomeLabels } from "./company-copy";
import {
  anonymousSliceLabel,
  balanceDisplayKeys,
  balanceValue,
  ebitdaMarginBasisPoints,
  incomeDisplayKeys,
  incomeValue,
  isEmphasisRow,
  isHeadcountRange,
  type BalanceAmounts,
  type BalanceDisplayKey,
  type HeadcountRangeId,
  type IncomeDisplayKey,
  type PnlAmounts,
  type SliceKind,
} from "./company-profile";

export const investorProjectSelect = {
  slug: true,
  codename: true,
  region: true,
  foundedYear: true,
  description: true,
  revenueCents: true,
  ebitdaCents: true,
  adjustedEbitdaCents: true,
  askingPriceCents: true,
  opexCents: true,
  headcountRange: true,
  customerBase: true,
  cnaes: {
    select: {
      code: true,
      role: true,
      position: true,
    },
  },
  activitySlices: {
    select: {
      kind: true,
      position: true,
      basisPoints: true,
    },
  },
  years: {
    select: {
      year: true,
      kind: true,
      salesCents: true,
      inventoryChangeCents: true,
      ownUseCents: true,
      suppliesCents: true,
      otherOperatingIncomeCents: true,
      staffCostsCents: true,
      otherOperatingCostsCents: true,
      grantIncomeCents: true,
      provisionSurplusCents: true,
      assetImpairmentCents: true,
      subsidiaryControlLossCents: true,
      negativeDifferenceCents: true,
      otherResultsCents: true,
      amortizationCents: true,
      currentAssetsCents: true,
      cashCents: true,
      nonCurrentAssetsCents: true,
      currentLiabilitiesCents: true,
      longTermDebtCents: true,
      nonCurrentLiabilitiesCents: true,
      shortTermDebtCents: true,
      equityCents: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export type InvestorYearColumn = {
  year: number;
  forecast: boolean;
};

export type InvestorStatementRow = {
  key: string;
  label: string;
  emphasis: boolean;
  values: Array<number | null>;
};

export type InvestorSlice = {
  label: string;
  basisPoints: number;
};

export type InvestorCnae = {
  code: string;
  title: string;
};

export type InvestorProjectProfile = {
  slug: string;
  codename: string;
  region: string;
  foundedYear: number | null;
  description: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  opexCents: number | null;
  ebitdaMarginBp: number | null;
  principalCnae: InvestorCnae | null;
  secondaryCnaes: InvestorCnae[];
  capital: InvestorSlice[];
  products: InvestorSlice[];
  clients: InvestorSlice[];
  customerBase: "business" | "consumer" | "mixed" | null;
  headcountRange: HeadcountRangeId | null;
  incomeYears: InvestorYearColumn[];
  incomeRows: InvestorStatementRow[];
  balanceYears: InvestorYearColumn[];
  balanceRows: InvestorStatementRow[];
};

type InvestorProjectRecord = {
  slug: string;
  codename: string;
  region: string;
  foundedYear: number | null;
  description: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  opexCents: number | null;
  headcountRange: string | null;
  customerBase: "business" | "consumer" | "mixed" | null;
  cnaes: { code: string; role: "principal" | "secondary"; position: number }[];
  activitySlices: { kind: SliceKind; position: number; basisPoints: number }[];
  years: Array<{
    year: number;
    kind: "closed" | "forecast";
    salesCents: number | null;
    inventoryChangeCents: number | null;
    ownUseCents: number | null;
    suppliesCents: number | null;
    otherOperatingIncomeCents: number | null;
    staffCostsCents: number | null;
    otherOperatingCostsCents: number | null;
    grantIncomeCents: number | null;
    provisionSurplusCents: number | null;
    assetImpairmentCents: number | null;
    subsidiaryControlLossCents: number | null;
    negativeDifferenceCents: number | null;
    otherResultsCents: number | null;
    amortizationCents: number | null;
    currentAssetsCents: number | null;
    cashCents: number | null;
    nonCurrentAssetsCents: number | null;
    currentLiabilitiesCents: number | null;
    longTermDebtCents: number | null;
    nonCurrentLiabilitiesCents: number | null;
    shortTermDebtCents: number | null;
    equityCents: number | null;
  }>;
};

function toPnl(year: InvestorProjectRecord["years"][number]): PnlAmounts {
  return {
    sales: year.salesCents,
    inventoryChange: year.inventoryChangeCents,
    ownUse: year.ownUseCents,
    supplies: year.suppliesCents,
    otherOperatingIncome: year.otherOperatingIncomeCents,
    staffCosts: year.staffCostsCents,
    otherOperatingCosts: year.otherOperatingCostsCents,
    grantIncome: year.grantIncomeCents,
    provisionSurplus: year.provisionSurplusCents,
    assetImpairment: year.assetImpairmentCents,
    subsidiaryControlLoss: year.subsidiaryControlLossCents,
    negativeDifference: year.negativeDifferenceCents,
    otherResults: year.otherResultsCents,
    amortization: year.amortizationCents,
  };
}

function toBalance(year: InvestorProjectRecord["years"][number]): BalanceAmounts {
  return {
    currentAssets: year.currentAssetsCents,
    cash: year.cashCents,
    nonCurrentAssets: year.nonCurrentAssetsCents,
    currentLiabilities: year.currentLiabilitiesCents,
    longTermDebt: year.longTermDebtCents,
    nonCurrentLiabilities: year.nonCurrentLiabilitiesCents,
    shortTermDebt: year.shortTermDebtCents,
    equity: year.equityCents,
  };
}

function cnaeChip(code: string): InvestorCnae | null {
  const title = cnaeTitle(code);

  if (!title) {
    return null;
  }

  return { code, title };
}

function slicesFor(record: InvestorProjectRecord, kind: SliceKind): InvestorSlice[] {
  return record.activitySlices
    .filter((slice) => slice.kind === kind)
    .sort((left, right) => left.position - right.position)
    .map((slice) => ({
      label: anonymousSliceLabel(kind, slice.position),
      basisPoints: slice.basisPoints,
    }));
}

export function toInvestorProject(record: InvestorProjectRecord): InvestorProjectProfile {
  const principal = record.cnaes
    .filter((cnae) => cnae.role === "principal")
    .sort((left, right) => left.position - right.position)[0];
  const years = [...record.years].sort((left, right) => left.year - right.year);
  const incomeYears = years.map((year) => ({ year: year.year, forecast: year.kind === "forecast" }));
  const balanceSource = years.filter((year) => year.kind === "closed");
  const incomeRows = incomeDisplayKeys.map((key) => ({
    key,
    label: incomeLabels[key],
    emphasis: isEmphasisRow(key),
    values: years.map((year) => incomeValue(key, toPnl(year))),
  }));
  const balanceRows = balanceDisplayKeys.map((key) => ({
    key,
    label: balanceLabels[key],
    emphasis: isEmphasisRow(key),
    values: balanceSource.map((year) => balanceValue(key, toBalance(year))),
  }));

  return {
    slug: record.slug,
    codename: record.codename,
    region: record.region,
    foundedYear: record.foundedYear,
    description: record.description,
    revenueCents: record.revenueCents,
    ebitdaCents: record.ebitdaCents,
    adjustedEbitdaCents: record.adjustedEbitdaCents,
    askingPriceCents: record.askingPriceCents,
    opexCents: record.opexCents,
    ebitdaMarginBp: ebitdaMarginBasisPoints(record.ebitdaCents, record.revenueCents),
    principalCnae: principal ? cnaeChip(principal.code) : null,
    secondaryCnaes: record.cnaes
      .filter((cnae) => cnae.role === "secondary")
      .sort((left, right) => left.position - right.position)
      .map((cnae) => cnaeChip(cnae.code))
      .filter((cnae): cnae is InvestorCnae => cnae !== null),
    capital: slicesFor(record, "capital"),
    products: slicesFor(record, "product"),
    clients: slicesFor(record, "client"),
    customerBase: record.customerBase,
    headcountRange: record.headcountRange && isHeadcountRange(record.headcountRange) ? record.headcountRange : null,
    incomeYears,
    incomeRows,
    balanceYears: balanceSource.map((year) => ({ year: year.year, forecast: false })),
    balanceRows,
  };
}

export type { IncomeDisplayKey, BalanceDisplayKey };
