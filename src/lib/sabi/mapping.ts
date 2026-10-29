import type { HeadcountRangeId } from "../company-profile";
import type { SabiRatioKey } from "./labels";
import type { SabiReport, SabiYear } from "./parse";

/** How many closed years go into the ficha (the full series stays in the import record). */
export const sabiFichaYears = 5;

export type SabiYearData = {
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
  financialResultCents: number | null;
  profitBeforeTaxCents: number | null;
  netResultCents: number | null;
  nonCurrentAssetsCents: number | null;
  currentAssetsCents: number | null;
  inventoryCents: number | null;
  receivablesCents: number | null;
  cashCents: number | null;
  equityCents: number | null;
  nonCurrentLiabilitiesCents: number | null;
  longTermDebtCents: number | null;
  currentLiabilitiesCents: number | null;
  shortTermDebtCents: number | null;
  suppliersCents: number | null;
  cashFlowCents: number | null;
  addedValueCents: number | null;
};

export type SabiRatios = Partial<Record<SabiRatioKey, number>>;

export type SabiMappedYear = { year: number; data: SabiYearData; ebitdaCents: number | null; employees: number | null; ratios: SabiRatios | null };

export type SabiProjectUpdate = {
  legalName: string | null;
  address: string | null;
  foundedYear: number | null;
  revenueCents: number | null;
  ebitdaCents: number | null;
  netIncomeCents: number | null;
  averageHeadcount: number | null;
  headcountRange: HeadcountRangeId | null;
  principalCnae: string | null;
  secondaryCnaes: string[];
  /** t60: lines that exist in the ficha but the first import left empty. */
  legalForm: string | null;
  accountsFormat: string | null;
  audited: boolean | null;
  region: string | null;
  opexCents: number | null;
  netDebtCents: number | null;
  workingCapitalCents: number | null;
  /** Shareholder names (admin-only) and, when SABI gives a clean split, the anonymous capital donut. */
  shareholderNames: string[];
  capitalBasisPoints: number[] | null;
};

export type SabiMapping = { years: SabiMappedYear[]; project: SabiProjectUpdate; warnings: string[] };

function negative(value: number | null | undefined): number | null {
  return value == null ? null : -Math.abs(value);
}

/**
 * SABI "Formato Global" → the ficha's P&L and balance lines (t56 model, euro cents, costs negative).
 * EBITDA and resultado de explotación match SABI: whatever SABI does not break down lands in
 * "otros gastos de explotación".
 */
export function mapSabiYear(year: SabiYear): { data: SabiYearData; ebitdaCents: number | null } {
  const money = year.money;
  const revenue = money.operatingRevenue ?? null;
  const sales = money.sales ?? revenue;
  const otherIncome = revenue !== null && sales !== null ? revenue - sales : null;
  const supplies =
    revenue !== null && money.grossResult != null
      ? money.grossResult - revenue
      : negative(money.materialsConsumption ?? money.materials) ?? (revenue !== null ? 0 : null);
  const staff = negative(money.staffCosts);
  const ebit = money.ebit ?? money.operatingResult ?? null;
  let amortization = negative(money.depreciation);
  let ebitda = money.ebitda ?? null;

  if (ebitda === null && ebit !== null) {
    ebitda = ebit - (amortization ?? 0);
  }

  if (amortization === null && ebitda !== null && ebit !== null) {
    amortization = ebit - ebitda;
  }

  const known = (sales ?? 0) + (otherIncome ?? 0) + (supplies ?? 0) + (staff ?? 0);
  const residual = ebitda !== null && sales !== null ? ebitda - known : null;
  const zero = residual !== null ? 0 : null;

  let nonCurrentLiabilities = money.nonCurrentLiabilities ?? null;
  const { totalLiabilitiesAndEquity, equity, currentLiabilities } = money;

  if (nonCurrentLiabilities === null && totalLiabilitiesAndEquity != null && equity != null && currentLiabilities != null) {
    const derived = totalLiabilitiesAndEquity - equity - currentLiabilities;
    nonCurrentLiabilities = Math.abs(derived) <= 100 ? 0 : derived;
  }

  return {
    ebitdaCents: ebitda,
    data: {
      salesCents: sales,
      inventoryChangeCents: zero,
      ownUseCents: zero,
      suppliesCents: supplies,
      otherOperatingIncomeCents: otherIncome ?? zero,
      staffCostsCents: staff ?? zero,
      otherOperatingCostsCents: residual,
      grantIncomeCents: zero,
      provisionSurplusCents: zero,
      assetImpairmentCents: zero,
      subsidiaryControlLossCents: zero,
      negativeDifferenceCents: zero,
      otherResultsCents: zero,
      amortizationCents: amortization,
      financialResultCents: money.financialResult ?? null,
      profitBeforeTaxCents: money.profitBeforeTax ?? null,
      netResultCents: money.netResult ?? null,
      nonCurrentAssetsCents: money.fixedAssets ?? null,
      currentAssetsCents: money.currentAssets ?? null,
      inventoryCents: money.inventory ?? null,
      receivablesCents: money.receivables ?? null,
      cashCents: money.cash ?? null,
      equityCents: equity ?? null,
      nonCurrentLiabilitiesCents: nonCurrentLiabilities,
      longTermDebtCents: money.longTermCreditors ?? null,
      currentLiabilitiesCents: currentLiabilities ?? null,
      shortTermDebtCents: money.financialDebt ?? null,
      suppliersCents: money.tradeCreditors ?? null,
      cashFlowCents: money.cashFlow ?? null,
      addedValueCents: money.addedValue ?? null,
    },
  };
}

export function headcountRangeFor(employees: number | null): HeadcountRangeId | null {
  if (employees === null || employees < 0) {
    return null;
  }

  if (employees <= 5) {
    return "band_1_5";
  }

  if (employees <= 10) {
    return "band_6_10";
  }

  if (employees <= 20) {
    return "band_11_20";
  }

  if (employees <= 50) {
    return "band_21_50";
  }

  return "band_over_50";
}

function ratiosOf(year: SabiYear): SabiRatios | null {
  const entries = Object.entries(year.ratios).filter((entry): entry is [SabiRatioKey, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]));
  return entries.length > 0 ? (Object.fromEntries(entries) as SabiRatios) : null;
}

function titleCase(value: string): string {
  return value.toLocaleLowerCase("es-ES").replace(/(^|[\s-])(\p{L})/gu, (_, gap: string, letter: string) => gap + letter.toLocaleUpperCase("es-ES"));
}

/** "Pendiente de tratamiento · PYME PGC 2007" → "PYME PGC 2007": the filing status is SABI's, not the company's. */
export function accountsFormatOf(basis: string | null): string | null {
  const parts = (basis ?? "").split("·").map((part) => part.trim()).filter((part) => part && !/pendiente|tratamiento/i.test(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function percentOf(value: string | null): number | null {
  const match = /^\s*(\d{1,3}(?:,\d+)?)\s*$/.exec(value ?? "");
  return match ? Number(match[1]!.replace(",", ".")) : null;
}

/** Only an exact, fully numeric split that adds up to 100 % becomes the capital donut. */
export function capitalSplit(report: SabiReport): number[] | null {
  const holders = report.shareholders;

  if (holders.length === 0) {
    return null;
  }

  const percents = holders.map((holder) => percentOf(holder.direct ?? holder.total));

  if (percents.some((value) => value === null || value <= 0)) {
    return null;
  }

  const points = (percents as number[]).map((value) => Math.round(value * 100)).sort((a, b) => b - a);
  return points.reduce((sum, value) => sum + value, 0) === 10_000 ? points : null;
}

function composeAddress(report: SabiReport): string | null {
  const { street, postalCode, city, province } = report.identity;
  const place = [postalCode, city].filter(Boolean).join(" ");
  const tail = province && province !== city ? `${place} (${province})` : place;
  const parts = [street, tail].filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function mapSabiReport(report: SabiReport): SabiMapping {
  const warnings: string[] = [];
  const closed = report.years.filter((year) => year.months === null || year.months >= 1).slice(0, sabiFichaYears);
  const years: SabiMappedYear[] = [];

  for (const year of closed) {
    const mapped = mapSabiYear(year);
    years.push({ year: year.year, data: mapped.data, ebitdaCents: mapped.ebitdaCents, employees: year.employees, ratios: ratiosOf(year) });
  }

  const latest = years[0] ?? null;
  const cnae = report.codes.cnae2009;
  const founded = report.identity.incorporatedOn ? Number(report.identity.incorporatedOn.slice(0, 4)) : null;
  const employees = report.identity.employees ?? latest?.employees ?? null;
  const data = latest?.data ?? null;
  const source = closed[0] ?? null;
  const opex = data ? [data.suppliesCents, data.staffCostsCents, data.otherOperatingCostsCents].filter((value): value is number => value !== null) : [];
  const debt = data && (data.longTermDebtCents !== null || data.shortTermDebtCents !== null) ? (data.longTermDebtCents ?? 0) + (data.shortTermDebtCents ?? 0) : null;
  const working =
    source?.money.workingCapital ??
    (data?.currentAssetsCents != null && data.currentLiabilitiesCents != null ? data.currentAssetsCents - data.currentLiabilitiesCents : null);

  return {
    years,
    warnings,
    project: {
      legalName: report.identity.legalName,
      address: composeAddress(report),
      foundedYear: founded,
      revenueCents: latest?.data.salesCents ?? null,
      ebitdaCents: latest?.ebitdaCents ?? null,
      netIncomeCents: latest?.data.netResultCents ?? null,
      averageHeadcount: latest?.employees ?? employees,
      headcountRange: headcountRangeFor(employees),
      principalCnae: cnae?.primary[0]?.code ?? null,
      secondaryCnaes: [...(cnae?.primary.slice(1) ?? []), ...(cnae?.secondary ?? [])].map((code) => code.code),
      legalForm: report.identity.legalForm,
      accountsFormat: accountsFormatOf(source?.basis ?? null),
      audited: report.auditor ? true : null,
      region: report.identity.province ? titleCase(report.identity.province) : null,
      opexCents: opex.length > 0 ? Math.abs(opex.reduce((sum, value) => sum + value, 0)) : null,
      netDebtCents: debt !== null ? debt - (data?.cashCents ?? 0) : null,
      workingCapitalCents: working,
      shareholderNames: [...new Set(report.shareholders.map((holder) => holder.name.trim()).filter(Boolean))],
      capitalBasisPoints: capitalSplit(report),
    },
  };
}
