import type { HeadcountRangeId } from "../company-profile";
import type { SabiReport, SabiYear } from "./parse";

/** Postgres INTEGER bounds: the ficha stores euro cents in 32-bit columns. */
const maxCents = 2_147_483_647;

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
};

export type SabiMappedYear = { year: number; data: SabiYearData; ebitdaCents: number | null; employees: number | null };

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

function fits(value: number | null): boolean {
  return value === null || Math.abs(value) <= maxCents;
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
    const overflow = Object.entries(mapped.data).filter(([, value]) => !fits(value));

    if (overflow.length > 0 || !fits(mapped.ebitdaCents)) {
      warnings.push(`En ${year.year} hay cifras por encima de 21,4 M€ que la ficha no puede guardar; se dejan en blanco.`);

      for (const [key] of overflow) {
        (mapped.data as Record<string, number | null>)[key] = null;
      }
    }

    years.push({ year: year.year, data: mapped.data, ebitdaCents: fits(mapped.ebitdaCents) ? mapped.ebitdaCents : null, employees: year.employees });
  }

  const latest = years[0] ?? null;
  const cnae = report.codes.cnae2009;
  const founded = report.identity.incorporatedOn ? Number(report.identity.incorporatedOn.slice(0, 4)) : null;
  const employees = report.identity.employees ?? latest?.employees ?? null;

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
    },
  };
}
