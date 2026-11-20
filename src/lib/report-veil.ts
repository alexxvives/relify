import { figureVeilCapital, figureVeilCents, figureVeilClient, figureVeilProduct, figureVeilYears } from "./figure-veil";
import type { InvestorProjectProfile } from "./investor-project";
import type { SabiYear } from "./sabi/insights";
import { adjustmentsForBuyer } from "./ebitda-adjustments";
import { reportHeadline } from "./company-report";

/**
 * t91: the locked (pre-NDA) ficha renders the SAME sections, blocks and order as after the NDA, so it is
 * built from the real shape (which years, which rows, which values exist) with every locked figure replaced
 * by an invented one. Nulls stay null so the same blocks appear; no real locked number reaches the page.
 */
const template = figureVeilYears();

function fakeYear(real: SabiYear, index: number): SabiYear {
  const shape = template[index % template.length]!;
  const pick = <K extends keyof SabiYear>(key: K): SabiYear[K] => (real[key] === null ? real[key] : shape[key]);
  return {
    year: real.year,
    months: real.months,
    employees: pick("employees"),
    revenueCents: pick("revenueCents"),
    suppliesCents: pick("suppliesCents"),
    staffCostsCents: pick("staffCostsCents"),
    ebitdaCents: pick("ebitdaCents"),
    ebitCents: pick("ebitCents"),
    financialResultCents: pick("financialResultCents"),
    profitBeforeTaxCents: pick("profitBeforeTaxCents"),
    netResultCents: pick("netResultCents"),
    totalAssetsCents: pick("totalAssetsCents"),
    nonCurrentAssetsCents: pick("nonCurrentAssetsCents"),
    currentAssetsCents: pick("currentAssetsCents"),
    cashCents: pick("cashCents"),
    equityCents: pick("equityCents"),
    nonCurrentLiabilitiesCents: pick("nonCurrentLiabilitiesCents"),
    currentLiabilitiesCents: pick("currentLiabilitiesCents"),
    longTermDebtCents: pick("longTermDebtCents"),
    shortTermDebtCents: pick("shortTermDebtCents"),
    workingCapitalCents: pick("workingCapitalCents"),
    ratios: Object.fromEntries(Object.keys(real.ratios).map((key, k) => [key, 5 + ((index * 3 + k * 7) % 20)])),
  };
}

export function veilYears(years: SabiYear[]): SabiYear[] {
  return years.map(fakeYear);
}

function veilValues(values: Array<number | null>, row: number, small = false): Array<number | null> {
  return values.map((value, column) => {
    if (value === null) return null;
    const percent = 40 + ((row * 7 + column * 11) % 50);
    return small ? percent / 4 : Math.round((figureVeilCents * percent) / 100);
  });
}

function veilSlices<T extends { label: string; basisPoints: number }>(real: T[], fake: { label: string; basisPoints: number }[]) {
  return real.length === 0 ? [] : fake;
}

const incomeFromYear: Record<string, (year: SabiYear) => number | null> = {
  sales: (year) => year.revenueCents,
  ebitda: (year) => year.ebitdaCents,
  supplies: (year) => year.suppliesCents,
  staffCosts: (year) => year.staffCostsCents,
};

const balanceFromYear: Record<string, (year: SabiYear) => number | null> = {
  currentAssets: (year) => year.currentAssetsCents,
  cash: (year) => year.cashCents,
  nonCurrentAssets: (year) => year.nonCurrentAssetsCents,
  totalAssets: (year) => year.totalAssetsCents,
  currentLiabilities: (year) => year.currentLiabilitiesCents,
  longTermDebt: (year) => year.longTermDebtCents,
  nonCurrentLiabilities: (year) => year.nonCurrentLiabilitiesCents,
  shortTermDebt: (year) => year.shortTermDebtCents,
  equity: (year) => year.equityCents,
};

function overlayFromYears(
  values: Array<number | null>,
  columns: Array<{ year: number; forecast?: boolean }> | undefined,
  years: SabiYear[],
  pick: ((year: SabiYear) => number | null) | undefined,
  fallbackRow: number,
  small = false,
): Array<number | null> {
  const veiled = veilValues(values, fallbackRow, small);
  if (!pick || !columns || columns.length === 0) {
    return veiled;
  }
  return veiled.map((value, index) => {
    if (value === null) {
      return null;
    }
    const column = columns[index];
    if (!column || column.forecast) {
      return value;
    }
    const year = years.find((item) => item.year === column.year);
    const next = year ? pick(year) : null;
    return next === null || next === undefined ? value : next;
  });
}

/**
 * Invented year rows and slices for the blurred body. Published header cards (facturación, EBITDA,
 * precio) keep `reportHeadline` so a buyer never sees 1 M / 180 k unblurred while /mercado shows 5 M / 750 k.
 */
export function veilReportFigures(project: InvestorProjectProfile): InvestorProjectProfile {
  const published = reportHeadline(project);
  const reportYears = project.reportYears ? veilYears(project.reportYears) : project.reportYears;
  const years = reportYears ?? [];
  return {
    ...project,
    reportYears,
    revenueCents: published.revenueCents,
    ebitdaCents: published.ebitdaCents,
    adjustedEbitdaCents: published.adjustedEbitdaCents,
    ebitdaAdjustments: project.ebitdaAdjustments,
    figuresVeiled: true,
    incomeRows: project.incomeRows.map((row, index) => ({
      ...row,
      values: overlayFromYears(row.values, project.incomeYears, years, incomeFromYear[row.key], index),
    })),
    balanceRows: project.balanceRows.map((row, index) => ({
      ...row,
      values: overlayFromYears(row.values, project.balanceYears, years, balanceFromYear[row.key], index + 3),
    })),
    detailRows: project.detailRows?.map((row, index) => ({ ...row, values: veilValues(row.values, index + 5) })),
    indicatorRows: project.indicatorRows?.map((row, index) => ({
      ...row,
      values: overlayFromYears(
        row.values,
        project.balanceYears,
        years,
        row.key === "employees" ? (year) => year.employees : row.key === "collectionDays" ? (year) => year.ratios.collectionDays ?? null : undefined,
        index,
        true,
      ),
    })),
    capital: veilSlices(project.capital, figureVeilCapital),
    products: veilSlices(project.products, figureVeilProduct),
    clients: veilSlices(project.clients, figureVeilClient),
  };
}

/**
 * t91-sec: the ONE gate for what a buyer's ficha page receives. Before the NDA every locked figure is swapped
 * for an invented one and adjustment motives are dropped here, on the server, so the HTML/RSC payload never
 * carries a real locked value (the report's blur is presentation only). After the NDA the profile is unchanged.
 */
export function buyerProjectView(project: InvestorProjectProfile, ndaAccepted: boolean): InvestorProjectProfile {
  const ebitdaAdjustments = adjustmentsForBuyer(project.ebitdaAdjustments, ndaAccepted);
  const viewed = { ...project, ebitdaAdjustments };
  return ndaAccepted ? viewed : veilReportFigures(viewed);
}

/** Investor-hired advisor: same server veil as the buyer until figuresOpen (advisor NDA + investor NDA). */
export function advisorProjectView(
  project: InvestorProjectProfile | null,
  hiredByInvestor: boolean,
  figuresOpen: boolean,
): InvestorProjectProfile | null {
  if (!project) {
    return null;
  }
  // S35: nothing beyond the public veil reaches the browser before the advisor's NDA (and its buyer's) is signed.
  if (!figuresOpen) {
    return buyerProjectView(project, false);
  }
  // A seller's advisor sees the company like the seller; a buyer's advisor sees exactly what that buyer sees.
  return hiredByInvestor ? buyerProjectView(project, true) : project;
}
