import { balanceDisplayKeys, incomeDisplayKeys, isEmphasisRow } from "./company-profile";
import type { SabiYear } from "@/lib/sabi/insights";
import { balanceLabels, incomeLabels } from "./company-copy";

/** Every locked figure is this many cents: 999.999,00 €. Real statements stay off the page. */
export const figureVeilCents = 99_999_900;

const years = [
  { year: 2023, forecast: false },
  { year: 2024, forecast: false },
  { year: 2025, forecast: false },
];

const money = years.map(() => figureVeilCents);

export const figureVeilCapital = [
  { label: "Parte 1", basisPoints: 6200 },
  { label: "Parte 2", basisPoints: 3800 },
];

export const figureVeilProduct = [
  { label: "Parte 1", basisPoints: 4500 },
  { label: "Parte 2", basisPoints: 3000 },
  { label: "Parte 3", basisPoints: 2500 },
];

export const figureVeilClient = [
  { label: "Parte 1", basisPoints: 2800 },
  { label: "Parte 2", basisPoints: 4700 },
  { label: "Parte 3", basisPoints: 2500 },
];

/** Bar heights behind the blur. Labels on the table stay at 999.999,00 €. */
const chartPercents: Record<string, number[]> = {
  sales: [58, 71, 86, 77],
  ebitda: [12, 18, 27, 21],
  supplies: [34, 29, 38, 31],
  staffCosts: [16, 21, 18, 24],
  otherOperatingCosts: [7, 11, 9, 14],
  amortization: [3, 5, 4, 6],
  currentAssets: [46, 62, 54],
  nonCurrentAssets: [72, 58, 81],
  equity: [38, 49, 44],
  currentLiabilities: [21, 28, 19],
  nonCurrentLiabilities: [17, 12, 22],
};

function shapedValues(key: string, count: number): number[] {
  const percents = chartPercents[key] ?? [40, 55, 48, 63];
  return Array.from({ length: count }, (_, index) => {
    const percent = percents[index] ?? percents[percents.length - 1] ?? 40;
    return Math.round((figureVeilCents * percent) / 100);
  });
}

export function figureVeilIncome() {
  return {
    years,
    rows: incomeDisplayKeys.map((key) => ({
      key,
      label: incomeLabels[key],
      emphasis: isEmphasisRow(key),
      values: money,
    })),
  };
}

export function figureVeilBalance() {
  return {
    years: years.filter((year) => !year.forecast),
    rows: balanceDisplayKeys.map((key) => ({
      key,
      label: balanceLabels[key],
      emphasis: isEmphasisRow(key),
      values: money,
    })),
  };
}

export function figureVeilChartIncome() {
  const sheet = figureVeilIncome();
  return {
    years: sheet.years,
    rows: sheet.rows.map((row) => ({
      ...row,
      values: shapedValues(row.key, sheet.years.length),
    })),
  };
}

export function figureVeilChartBalance() {
  const sheet = figureVeilBalance();
  return {
    years: sheet.years,
    rows: sheet.rows.map((row) => ({
      ...row,
      values: shapedValues(row.key, sheet.years.length),
    })),
  };
}

/** t84: fake years (all invented) so blurred placeholders reuse the current report charts. */
export function figureVeilYears(): SabiYear[] {
  const shape = [0.62, 0.74, 0.88, 1];
  return shape.map((k, index) => {
    const revenue = Math.round(figureVeilCents * k);
    const assets = Math.round(figureVeilCents * (0.7 + index * 0.08));
    return {
      year: 2021 + index,
      months: 12,
      employees: 14 + index * 3,
      revenueCents: revenue,
      suppliesCents: Math.round(revenue * 0.35),
      staffCostsCents: Math.round(revenue * 0.3),
      ebitdaCents: Math.round(revenue * (0.12 + index * 0.02)),
      ebitCents: Math.round(revenue * (0.09 + index * 0.02)),
      financialResultCents: -Math.round(revenue * 0.01),
      profitBeforeTaxCents: Math.round(revenue * (0.08 + index * 0.015)),
      netResultCents: Math.round(revenue * (0.06 + index * 0.012)),
      totalAssetsCents: assets,
      nonCurrentAssetsCents: Math.round(assets * 0.45),
      currentAssetsCents: Math.round(assets * 0.55),
      cashCents: Math.round(assets * 0.18),
      equityCents: Math.round(assets * (0.42 + index * 0.03)),
      nonCurrentLiabilitiesCents: Math.round(assets * 0.22),
      currentLiabilitiesCents: Math.round(assets * (0.36 - index * 0.03)),
      longTermDebtCents: Math.round(assets * 0.18),
      shortTermDebtCents: Math.round(assets * 0.1),
      workingCapitalCents: Math.round(assets * (0.19 + index * 0.03)),
      ratios: {},
    };
  });
}

/** t84: invented percentages for the profitability placeholder lines. */
export const figureVeilMargins = [
  [11, 13, 15, 17],
  [6, 7.5, 8.5, 10],
  [9, 10, 12, 13],
  [18, 20, 23, 25],
];
