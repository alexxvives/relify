import { balanceDisplayKeys, incomeDisplayKeys, isEmphasisRow } from "./company-profile";
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
