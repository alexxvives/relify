import { balanceDisplayKeys, incomeDisplayKeys, isEmphasisRow } from "./company-profile";
import { balanceLabels, incomeLabels } from "./company-copy";

/** Every locked figure is this many cents: 999.999,00 €. Real statements stay off the page. */
export const figureVeilCents = 99_999_900;

const years = [
  { year: 2023, forecast: false },
  { year: 2024, forecast: false },
  { year: 2025, forecast: false },
  { year: 2026, forecast: true },
];

const money = years.map(() => figureVeilCents);

export const figureVeilSlices = [
  { label: "Parte 1", basisPoints: 4500 },
  { label: "Parte 2", basisPoints: 3500 },
  { label: "Parte 3", basisPoints: 2000 },
];

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
      values: money.slice(0, 3),
    })),
  };
}
