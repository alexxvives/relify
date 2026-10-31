import { formatCompactEur } from "@/lib/money";
import { financialDebtCents, marginPercent, netDebtCents, netDebtToEbitda, type SabiYear } from "@/lib/sabi/insights";

/* t69: plain (non-client) helpers for the company report, so server components can call them. */
/** t69: chart and registry building blocks for the company report (was the t68 "Análisis SABI" panel). */
export const reportChartsCopy = {
  showTable: "Ver tabla",
  hideTable: "Ocultar tabla",
  noData: "Sin datos.",
};

export const navy = "#1c2740";
export const teal = "#0f766e";
export const tealMid = "#2fc4b2";
export const tealLight = "#7fd6cc";
export const loss = "#c23b3b";

export const schemeLabels: Record<string, string> = {
  cnae2009: "CNAE 2009",
  cnae2025: "CNAE 2025",
  nace: "NACE Rev. 2",
  cae: "CAE",
  ussic: "US SIC",
  iae: "IAE",
  naics: "NAICS",
};

export const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
export const decimal2 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const integer = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export type Unit = "eur" | "pct" | "x" | "days" | "keur" | "people";

export function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case "eur":
      return formatCompactEur(value);
    case "pct":
      return `${decimal.format(value)} %`;
    case "x":
      return `${decimal2.format(value)}x`;
    case "days":
      return `${integer.format(value)} días`;
    case "keur":
      return `${decimal.format(value)} k€`;
    case "people":
      return integer.format(value);
  }
}

export function formatDelta(delta: number, previous: number, unit: Unit): string {
  const sign = delta > 0 ? "+" : "";
  if (unit === "pct") {
    return `${sign}${decimal.format(delta)} p.p.`;
  }

  if (unit === "x") {
    return `${sign}${decimal2.format(delta)}x`;
  }

  if (unit === "days") {
    return `${sign}${integer.format(delta)} días`;
  }

  if (previous === 0) {
    return unit === "eur" ? `${sign}${formatCompactEur(delta)}` : `${sign}${decimal.format(delta)}`;
  }

  return `${sign}${decimal.format((delta / Math.abs(previous)) * 100)} %`;
}

export function isoDay(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const [year, month, day] = iso.split("-");
  return day ? `${day}/${month}/${year}` : iso;
}

export function yearLabel(year: SabiYear): string {
  return year.months !== null && year.months !== 12 ? `${year.year} (${year.months} m)` : String(year.year);
}

export type Metric = { key: string; label: string; unit: Unit; better: "up" | "down" | "none"; hint: string; values: Array<number | null> };

/* ---------- metric catalogue (plain Spanish: what it is + how it is computed) ---------- */

function ratio(years: SabiYear[], key: string): Array<number | null> {
  return years.map((year) => year.ratios[key] ?? null);
}

export function metrics(years: SabiYear[]): { kpis: Metric[]; debt: Metric[] } {
  const field = (pick: (year: SabiYear) => number | null) => years.map(pick);
  const kpis: Metric[] = [
    { key: "revenue", label: "Ingresos de explotación", unit: "eur", better: "up", values: field((year) => year.revenueCents), hint: "Todo lo que la empresa ingresa por su actividad (ventas y otros ingresos de explotación) en el ejercicio. La variación es el cambio en % frente al año anterior." },
    { key: "ebitdaMargin", label: "Margen EBITDA", unit: "pct", better: "up", values: field((year) => marginPercent(year.ebitdaCents, year.revenueCents)), hint: "Qué parte de cada euro ingresado queda tras pagar los gastos de explotación, antes de amortizaciones, intereses e impuestos.\nCálculo: EBITDA ÷ ingresos de explotación × 100." },
    { key: "profitMargin", label: "Margen de beneficio", unit: "pct", better: "up", values: ratio(years, "profitMargin"), hint: "Beneficio (o pérdida) antes de impuestos por cada 100 € de ingresos.\nCálculo (SABI): resultado antes de impuestos ÷ ingresos de explotación × 100." },
    { key: "economicReturn", label: "Rentabilidad económica (ROA)", unit: "pct", better: "up", values: ratio(years, "economicReturn"), hint: "Lo que rinden todos los activos de la empresa, se financien como se financien.\nCálculo (SABI): resultado antes de impuestos ÷ total activo × 100." },
    { key: "financialReturn", label: "Rentabilidad financiera (ROE)", unit: "pct", better: "up", values: ratio(years, "financialReturn"), hint: "Lo que rinde el dinero de los socios.\nCálculo (SABI): resultado antes de impuestos ÷ fondos propios × 100." },
    { key: "staffCostToRevenue", label: "Gastos de personal / ingresos", unit: "pct", better: "down", values: ratio(years, "staffCostToRevenue"), hint: "Qué porcentaje de los ingresos se va en sueldos y cargas sociales.\nCálculo (SABI): gastos de personal ÷ ingresos de explotación × 100." },
    { key: "revenuePerEmployee", label: "Ingresos por empleado", unit: "keur", better: "up", values: ratio(years, "revenuePerEmployee"), hint: "Productividad comercial de la plantilla, en miles de euros.\nCálculo (SABI): ingresos de explotación ÷ número de empleados." },
    { key: "averageStaffCost", label: "Coste medio por empleado", unit: "keur", better: "none", values: ratio(years, "averageStaffCost"), hint: "Coste anual medio de cada empleado (sueldo + seguridad social), en miles de euros.\nCálculo (SABI): gastos de personal ÷ número de empleados." },
  ];
  const debt: Metric[] = [
    { key: "financialDebt", label: "Deuda financiera", unit: "eur", better: "down", values: field(financialDebtCents), hint: "Dinero que la empresa debe a terceros con coste o a largo plazo.\nCálculo: acreedores a largo plazo + deudas financieras a corto plazo del balance." },
    { key: "cash", label: "Tesorería", unit: "eur", better: "up", values: field((year) => year.cashCents), hint: "Efectivo y equivalentes en caja y bancos al cierre del ejercicio." },
    { key: "netDebt", label: "Deuda neta", unit: "eur", better: "down", values: field(netDebtCents), hint: "Deuda que quedaría si se usara toda la caja para pagarla. Si es negativa, la empresa tiene más caja que deuda.\nCálculo: deuda financiera − tesorería." },
    { key: "netDebtToEbitda", label: "Deuda neta / EBITDA", unit: "x", better: "down", values: field(netDebtToEbitda), hint: "Cuántos años de EBITDA harían falta para devolver la deuda neta. Solo se calcula con EBITDA positivo.\nCálculo: deuda neta ÷ EBITDA." },
    { key: "workingCapital", label: "Fondo de maniobra", unit: "eur", better: "up", values: field((year) => year.workingCapitalCents), hint: "Colchón para el día a día: lo que sobra de activo corriente tras cubrir las deudas a corto plazo (según SABI)." },
    { key: "generalLiquidity", label: "Liquidez general", unit: "x", better: "up", values: ratio(years, "generalLiquidity"), hint: "Cuántas veces cubre el activo corriente las deudas a corto plazo. Por encima de 1 es holgado.\nCálculo (SABI): activo corriente ÷ pasivo corriente." },
    { key: "liquidityRatio", label: "Prueba ácida", unit: "x", better: "up", values: ratio(years, "liquidityRatio"), hint: "Como la liquidez general pero sin contar las existencias, que tardan más en convertirse en dinero.\nCálculo (SABI): (activo corriente − existencias) ÷ pasivo corriente." },
    { key: "indebtedness", label: "Endeudamiento", unit: "pct", better: "down", values: ratio(years, "indebtedness"), hint: "Qué parte del balance está financiada con deudas en lugar de con fondos propios.\nCálculo (SABI): (pasivo no corriente + pasivo corriente) ÷ total pasivo × 100." },
    { key: "solvencyCoefficient", label: "Coeficiente de solvencia", unit: "pct", better: "up", values: ratio(years, "solvencyCoefficient"), hint: "Qué parte del activo pertenece a los socios.\nCálculo (SABI): fondos propios ÷ total activo × 100." },
    { key: "gearing", label: "Apalancamiento (gearing)", unit: "pct", better: "down", values: ratio(years, "gearing"), hint: "Deuda que soporta la empresa por cada 100 € de fondos propios.\nCálculo (SABI): (pasivo no corriente + préstamos a corto) ÷ fondos propios × 100." },
    { key: "interestCoverage", label: "Cobertura de intereses", unit: "x", better: "up", values: ratio(years, "interestCoverage"), hint: "Cuántas veces paga el resultado de explotación los intereses de la deuda. Negativo si hay pérdidas de explotación.\nCálculo (SABI): resultado de explotación (EBIT) ÷ gastos financieros." },
    { key: "collectionDays", label: "Periodo de cobro", unit: "days", better: "down", values: ratio(years, "collectionDays"), hint: "Días que tardan de media los clientes en pagar.\nCálculo (SABI): deudores comerciales ÷ ingresos de explotación × 360." },
    { key: "creditDays", label: "Periodo de pago", unit: "days", better: "none", values: ratio(years, "creditDays"), hint: "Días que tarda de media la empresa en pagar a sus proveedores.\nCálculo (SABI): acreedores comerciales ÷ ingresos de explotación × 360." },
  ];
  const present = (metric: Metric) => metric.values.some((value) => value !== null);
  return { kpis: kpis.filter(present), debt: debt.filter(present) };
}
