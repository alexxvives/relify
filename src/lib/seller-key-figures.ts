import type { SabiYear } from "./sabi/insights";

export type KeyFigure = {
  key: string;
  label: string;
  unit: "eur" | "count";
  value: number;
  year: number;
  /** Months in that fiscal year when it isn't a full year (e.g. 11). */
  months: number | null;
};

const metrics: Array<{ key: string; label: string; unit: KeyFigure["unit"]; pick: (year: SabiYear) => number | null }> = [
  { key: "revenue", label: "Ingresos", unit: "eur", pick: (year) => year.revenueCents },
  { key: "ebitda", label: "EBITDA", unit: "eur", pick: (year) => year.ebitdaCents },
  { key: "netResult", label: "Resultado", unit: "eur", pick: (year) => year.netResultCents },
  { key: "employees", label: "Empleados", unit: "count", pick: (year) => year.employees },
  { key: "totalAssets", label: "Activo", unit: "eur", pick: (year) => year.totalAssetsCents },
  { key: "equity", label: "Patrimonio neto", unit: "eur", pick: (year) => year.equityCents },
  {
    key: "debt",
    label: "Deuda financiera",
    unit: "eur",
    pick: (year) =>
      year.longTermDebtCents === null && year.shortTermDebtCents === null
        ? null
        : (year.longTermDebtCents ?? 0) + (year.shortTermDebtCents ?? 0),
  },
];

/** t78: "Tus cifras" shows only key numbers: each metric from the latest closed year that has it, with that year. */
export function sellerKeyFigures(years: SabiYear[] | null | undefined): KeyFigure[] {
  const newestFirst = [...(years ?? [])].sort((left, right) => right.year - left.year);
  return metrics.flatMap((metric) => {
    const found = newestFirst.find((year) => metric.pick(year) !== null);
    if (!found) {
      return [];
    }
    const months = found.months !== null && found.months !== 12 ? found.months : null;
    return [{ key: metric.key, label: metric.label, unit: metric.unit, value: metric.pick(found) as number, year: found.year, months }];
  });
}
