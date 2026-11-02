import { storedEbitdaAdjustments, type EbitdaAdjustment } from "./ebitda-adjustments";
import type { Prisma } from "@/generated/prisma/client";
import { cnaeTitle } from "./cnae-2009";
import { toSabiYear, type SabiYear } from "./sabi/insights";
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
  saleReason: true,
  revenueCents: true,
  ebitdaCents: true,
  adjustedEbitdaCents: true,
  ebitdaAdjustments: true,
  askingPriceCents: true,
  opexCents: true,
  headcountRange: true,
  customerBase: true,
  legalForm: true,
  accountsFormat: true,
  audited: true,
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
      financialResultCents: true,
      profitBeforeTaxCents: true,
      netResultCents: true,
      cashFlowCents: true,
      addedValueCents: true,
      inventoryCents: true,
      receivablesCents: true,
      suppliersCents: true,
      employees: true,
      ratios: true,
      dataSource: true,
      months: true,
      operatingRevenueCents: true,
      ebitdaCents: true,
      ebitCents: true,
      totalAssetsCents: true,
      workingCapitalCents: true,
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
  /** t68: optional label override (e.g. "> 50 %" for SABI lower bounds). */
  detail?: string;
};

export type InvestorCnae = {
  code: string;
  title: string;
};

export type IndicatorUnit = "percent" | "multiple" | "days" | "thousands" | "count";

export type InvestorIndicatorRow = {
  key: string;
  label: string;
  unit: IndicatorUnit;
  values: Array<number | null>;
};

export type InvestorProjectProfile = {
  /** Closed years come from the seller's confirmed Modelo 200 / cuentas upload. */
  sellerProvided?: boolean;
  slug: string;
  codename: string;
  region: string;
  foundedYear: number | null;
  description: string | null;
  saleReason: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  /** t82: itemised adjustments; null = legacy/none. Reasons are null for a buyer before the NDA. */
  ebitdaAdjustments: EbitdaAdjustment[] | null;
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
  /** t60 (SABI): legal form and accounts, never the name. */
  legalForm?: string | null;
  accountsFormat?: string | null;
  audited?: boolean | null;
  /** Closed-year lines below the operating result plus working-capital items; only rows with data. */
  detailRows?: InvestorStatementRow[];
  /** Closed-year ratios and staff; only rows with data. Same columns as balanceYears. */
  indicatorRows?: InvestorIndicatorRow[];
  /** t81: columns of detailRows/indicatorRows when they differ from balanceYears (seller preview). */
  detailYears?: InvestorYearColumn[];
  /** t69: closed years as plain numbers for the visual report (same data as the tables above, oldest first). */
  reportYears?: SabiYear[];
};

type InvestorProjectRecord = {
  slug: string;
  codename: string;
  region: string;
  foundedYear: number | null;
  description: string | null;
  saleReason: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ebitdaAdjustments: unknown;
  askingPriceCents: number;
  opexCents: number | null;
  headcountRange: string | null;
  customerBase: "business" | "consumer" | "mixed" | null;
  legalForm?: string | null;
  accountsFormat?: string | null;
  audited?: boolean | null;
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
    financialResultCents?: number | null;
    profitBeforeTaxCents?: number | null;
    netResultCents?: number | null;
    cashFlowCents?: number | null;
    addedValueCents?: number | null;
    inventoryCents?: number | null;
    receivablesCents?: number | null;
    suppliersCents?: number | null;
    employees?: number | null;
    ratios?: unknown;
    dataSource?: string | null;
    months?: number | null;
    operatingRevenueCents?: number | bigint | null;
    ebitdaCents?: number | bigint | null;
    ebitCents?: number | bigint | null;
    totalAssetsCents?: number | bigint | null;
    workingCapitalCents?: number | bigint | null;
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

type RecordYear = InvestorProjectRecord["years"][number];

const detailLines: Array<{ key: keyof RecordYear; label: string; emphasis: boolean }> = [
  { key: "financialResultCents", label: "Resultado financiero", emphasis: false },
  { key: "profitBeforeTaxCents", label: "Resultado antes de impuestos", emphasis: false },
  { key: "netResultCents", label: "Resultado del ejercicio", emphasis: true },
  { key: "cashFlowCents", label: "Cash flow", emphasis: false },
  { key: "addedValueCents", label: "Valor añadido", emphasis: false },
  { key: "inventoryCents", label: "Existencias", emphasis: false },
  { key: "receivablesCents", label: "Deudores comerciales", emphasis: false },
  { key: "suppliersCents", label: "Acreedores comerciales", emphasis: false },
];

const indicatorLines: Array<{ key: string; label: string; unit: IndicatorUnit }> = [
  { key: "profitMargin", label: "Margen de beneficio", unit: "percent" },
  { key: "economicReturn", label: "Rentabilidad económica (ROA)", unit: "percent" },
  { key: "financialReturn", label: "Rentabilidad financiera (ROE)", unit: "percent" },
  { key: "returnOnCapitalEmployed", label: "Rentabilidad del capital empleado", unit: "percent" },
  { key: "generalLiquidity", label: "Liquidez general", unit: "multiple" },
  { key: "solvencyRatio", label: "Ratio de solvencia", unit: "multiple" },
  { key: "indebtedness", label: "Endeudamiento", unit: "percent" },
  { key: "solvencyCoefficient", label: "Coeficiente de solvencia", unit: "percent" },
  { key: "gearing", label: "Apalancamiento", unit: "percent" },
  { key: "interestCoverage", label: "Cobertura de intereses", unit: "multiple" },
  { key: "collectionDays", label: "Periodo de cobro", unit: "days" },
  { key: "creditDays", label: "Periodo de pago", unit: "days" },
  { key: "staffCostToRevenue", label: "Coste de personal / ingresos", unit: "percent" },
  { key: "averageStaffCost", label: "Coste medio por empleado", unit: "thousands" },
  { key: "revenuePerEmployee", label: "Ingresos por empleado", unit: "thousands" },
  { key: "profitPerEmployee", label: "Beneficio por empleado", unit: "thousands" },
];

function ratioOf(year: RecordYear, key: string): number | null {
  const ratios = year.ratios;

  if (!ratios || typeof ratios !== "object" || Array.isArray(ratios)) {
    return null;
  }

  const value = (ratios as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function withData<T extends { values: Array<number | null> }>(rows: T[]): T[] {
  return rows.filter((row) => row.values.some((value) => value !== null));
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

/** One closed year for the report: SABI subtotals when published, otherwise the same figures the tables compute. */
function reportYear(year: RecordYear): SabiYear {
  const base = toSabiYear({
    year: year.year,
    months: year.months ?? null,
    employees: year.employees ?? null,
    ratios: year.ratios,
    salesCents: year.salesCents,
    operatingRevenueCents: year.operatingRevenueCents ?? null,
    suppliesCents: year.suppliesCents,
    staffCostsCents: year.staffCostsCents,
    ebitdaCents: year.ebitdaCents ?? null,
    ebitCents: year.ebitCents ?? null,
    financialResultCents: year.financialResultCents ?? null,
    profitBeforeTaxCents: year.profitBeforeTaxCents ?? null,
    netResultCents: year.netResultCents ?? null,
    totalAssetsCents: year.totalAssetsCents ?? null,
    nonCurrentAssetsCents: year.nonCurrentAssetsCents,
    currentAssetsCents: year.currentAssetsCents,
    cashCents: year.cashCents,
    equityCents: year.equityCents,
    nonCurrentLiabilitiesCents: year.nonCurrentLiabilitiesCents,
    currentLiabilitiesCents: year.currentLiabilitiesCents,
    longTermDebtCents: year.longTermDebtCents,
    shortTermDebtCents: year.shortTermDebtCents,
    workingCapitalCents: year.workingCapitalCents ?? null,
  });
  const pnl = toPnl(year);
  const balance = toBalance(year);
  const finite = (value: number | null) => (value === null || !Number.isFinite(value) ? null : value);
  return {
    ...base,
    ebitdaCents: base.ebitdaCents ?? finite(incomeValue("ebitda", pnl)),
    ebitCents: base.ebitCents ?? finite(incomeValue("operatingResult", pnl)),
    totalAssetsCents: base.totalAssetsCents ?? finite(balanceValue("totalAssets", balance)),
  };
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

  const detailRows = withData(
    detailLines.map((line) => ({
      key: String(line.key),
      label: line.label,
      emphasis: line.emphasis,
      values: balanceSource.map((year) => {
        const value = year[line.key];
        return typeof value === "number" ? value : null;
      }),
    })),
  );
  const indicatorRows = withData([
    { key: "employees", label: "Empleados", unit: "count" as const, values: balanceSource.map((year) => year.employees ?? null) },
    ...indicatorLines.map((line) => ({ ...line, values: balanceSource.map((year) => ratioOf(year, line.key)) })),
  ]);

  const reportYears = balanceSource.map((year) => reportYear(year));

  return {
    reportYears,
    slug: record.slug,
    legalForm: record.legalForm ?? null,
    accountsFormat: record.accountsFormat ?? null,
    audited: record.audited ?? null,
    detailRows,
    indicatorRows,
    codename: record.codename,
    region: record.region,
    foundedYear: record.foundedYear,
    description: record.description,
    saleReason: record.saleReason,
    revenueCents: record.revenueCents,
    ebitdaCents: record.ebitdaCents,
    adjustedEbitdaCents: record.adjustedEbitdaCents,
    ebitdaAdjustments: storedEbitdaAdjustments(record.ebitdaAdjustments),
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
    sellerProvided: years.some((year) => year.kind === "closed" && year.dataSource === "vendedor"),
  };
}

export type { IncomeDisplayKey, BalanceDisplayKey };
