import {
  capexToSalesAverage,
  collectionDaysOf,
  costPerEmployeeCents,
  creditDaysOf,
  fondoDeManiobraCents,
  nofCents,
  nofDeltaCents,
  nofToSalesPercent,
  revenuePerEmployeeCents,
} from "./financial-metrics";
import { formatCardEur } from "./money";
import { netDebtCents, type SabiYear } from "./sabi/insights";

export type KeyFigure = {
  key: string;
  label: string;
  unit: "eur" | "count" | "percent";
  value: number;
  year: number;
  /** Months in that fiscal year when it isn't a full year (e.g. 11). */
  months: number | null;
};

const metrics: Array<{ key: string; label: string; unit: KeyFigure["unit"]; pick: (year: SabiYear) => number | null }> = [
  { key: "revenue", label: "Facturación", unit: "eur", pick: (year) => year.revenueCents },
  { key: "ebitda", label: "EBITDA", unit: "eur", pick: (year) => year.ebitdaCents },
  {
    // Percent of the same year's revenue, one decimal. Gross financial debt was dropped so Tus cifras stays at 8.
    key: "ebitdaMargin",
    label: "Margen EBITDA",
    unit: "percent",
    pick: (year) =>
      year.ebitdaCents === null || year.revenueCents === null || year.revenueCents <= 0
        ? null
        : Math.round((year.ebitdaCents / year.revenueCents) * 1000) / 10,
  },
  { key: "netResult", label: "Resultado", unit: "eur", pick: (year) => year.netResultCents },
  { key: "employees", label: "Empleados", unit: "count", pick: (year) => year.employees },
  { key: "totalAssets", label: "Activo", unit: "eur", pick: (year) => year.totalAssetsCents },
  { key: "equity", label: "Patrimonio neto", unit: "eur", pick: (year) => year.equityCents },
  { key: "netDebt", label: "Deuda neta", unit: "eur", pick: (year) => netDebtCents(year) },
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
    const value = metric.pick(found);
    if (value === null) {
      return [];
    }
    return [{ key: metric.key, label: metric.label, unit: metric.unit, value, year: found.year, months }];
  });
}

export type OperatingFigure = {
  key: string;
  label: string;
  display: string;
  hint: string;
};

const daysFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const pctFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 0 });

/**
 * Extra operating figures for Ver detalle / ficha. They stay off the 8 Tus cifras tiles.
 */
export function sellerOperatingFigures(years: SabiYear[] | null | undefined): OperatingFigure[] {
  const sorted = [...(years ?? [])].sort((left, right) => left.year - right.year);
  const last = sorted.at(-1);
  if (!last) {
    return [];
  }
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] ?? null : null;
  const rows: Array<{ key: string; label: string; hint: string; display: string | null }> = [
    {
      key: "nof",
      label: "NOF",
      hint: "Necesidades operativas de fondos: el dinero que el negocio deja inmovilizado en existencias y clientes, una vez descontada la caja y sin contar la deuda bancaria a corto. Cálculo: activo corriente − caja − (pasivo corriente − deuda financiera a corto).",
      display: nofCents(last) === null ? null : formatCardEur(nofCents(last) ?? 0),
    },
    {
      key: "nofToSales",
      label: "NOF / ventas",
      hint: "Qué parte de las ventas del año está atada en el ciclo de explotación.",
      display: nofToSalesPercent(last) === null ? null : `${pctFormat.format(nofToSalesPercent(last) ?? 0)} %`,
    },
    {
      key: "nofDelta",
      label: "Variación de NOF",
      hint: "Cambio de las necesidades operativas de fondos respecto al ejercicio anterior. Si sube, el negocio ha absorbido caja.",
      display: nofDeltaCents(last, previous) === null ? null : formatCardEur(nofDeltaCents(last, previous) ?? 0),
    },
    {
      key: "workingCapital",
      label: "Fondo de maniobra",
      hint: "Colchón para el día a día. Cálculo: activo corriente − pasivo corriente, del mismo ejercicio.",
      display: fondoDeManiobraCents(last) === null ? null : formatCardEur(fondoDeManiobraCents(last) ?? 0),
    },
    {
      key: "capexToSales",
      label: "Capex / ventas (3 años, aprox.)",
      hint: "Media de los últimos tres ejercicios con dato. Aproximada: (variación del activo no corriente + EBITDA − EBIT) ÷ ventas.",
      display: capexToSalesAverage(sorted) === null ? null : `${pctFormat.format(capexToSalesAverage(sorted) ?? 0)} %`,
    },
    {
      key: "employees",
      label: "Plantilla",
      hint: "Número de empleados del último ejercicio cerrado.",
      display: last.employees === null ? null : daysFormat.format(last.employees),
    },
    {
      key: "costPerEmployee",
      label: "Coste medio por empleado",
      hint: "Gastos de personal del ejercicio divididos por la plantilla.",
      display: costPerEmployeeCents(last) === null ? null : formatCardEur(costPerEmployeeCents(last) ?? 0),
    },
    {
      key: "revenuePerEmployee",
      label: "Ingresos por empleado",
      hint: "Ventas del ejercicio divididas por la plantilla.",
      display: revenuePerEmployeeCents(last) === null ? null : formatCardEur(revenuePerEmployeeCents(last) ?? 0),
    },
    {
      key: "collectionDays",
      label: "Periodo medio de cobro",
      hint: "Días que tardan de media los clientes en pagar, según SABI.",
      display: collectionDaysOf(last) === null ? null : `${daysFormat.format(collectionDaysOf(last) ?? 0)} días`,
    },
    {
      key: "creditDays",
      label: "Periodo medio de pago",
      hint: "Días que tarda de media la empresa en pagar a sus proveedores, según SABI.",
      display: creditDaysOf(last) === null ? null : `${daysFormat.format(creditDaysOf(last) ?? 0)} días`,
    },
  ];
  return rows.flatMap((row) => (row.display === null ? [] : [{ key: row.key, label: row.label, display: row.display, hint: row.hint }]));
}
