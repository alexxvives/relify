import { figureVeilCapital, figureVeilCents, figureVeilClient, figureVeilProduct, figureVeilYears } from "./figure-veil";
import type { InvestorProjectProfile } from "./investor-project";
import type { SabiYear } from "./sabi/insights";

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

/** Same shape as the profile, invented locked figures. Public facts (KPIs, deal, business) stay as they are. */
export function veilReportFigures(project: InvestorProjectProfile): InvestorProjectProfile {
  return {
    ...project,
    reportYears: project.reportYears ? veilYears(project.reportYears) : project.reportYears,
    incomeRows: project.incomeRows.map((row, index) => ({ ...row, values: veilValues(row.values, index) })),
    balanceRows: project.balanceRows.map((row, index) => ({ ...row, values: veilValues(row.values, index + 3) })),
    detailRows: project.detailRows?.map((row, index) => ({ ...row, values: veilValues(row.values, index + 5) })),
    indicatorRows: project.indicatorRows?.map((row, index) => ({ ...row, values: veilValues(row.values, index, true) })),
    capital: veilSlices(project.capital, figureVeilCapital),
    products: veilSlices(project.products, figureVeilProduct),
    clients: veilSlices(project.clients, figureVeilClient),
  };
}
