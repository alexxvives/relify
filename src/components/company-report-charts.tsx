"use client";

import { useState, type ReactNode } from "react";
import { FieldHint } from "@/components/field-hint";
import { tooltipBubble } from "@/components/ui/info-hint";
import { formatCompactEur } from "@/lib/money";
import {
  financialDebtCents,
  marginPercent,
  netDebtCents,
  netDebtToEbitda,
  pnlWaterfall,
  yearOverYear,
  type SabiYear,
  type WaterfallStep,
} from "@/lib/sabi/insights";
import type { HealthSignal } from "@/lib/company-report";
import type { SabiHolding, SabiPerson } from "@/lib/sabi/parse";

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

const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const decimal2 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const integer = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

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

function formatDelta(delta: number, previous: number, unit: Unit): string {
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

/* ---------- shared bits ---------- */

export function ChartBox({ title, hint, legend, table, children }: { title: string; hint?: string; legend?: ReactNode; table?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
          {title}
          {hint ? <FieldHint text={hint} wide /> : null}
        </h3>
        {table ? (
          <button
            type="button"
            onClick={() => {
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
          >
            {open ? reportChartsCopy.hideTable : reportChartsCopy.showTable}
          </button>
        ) : null}
      </div>
      {legend ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5c6b78]">{legend}</div> : null}
      <div className="mt-3">{children}</div>
      {table && open ? <div className="mt-4 overflow-x-auto rounded-lg border border-[#eef0f4]">{table}</div> : null}
    </section>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span role="tooltip" className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap group-focus:block group-hover:block ${tooltipBubble}`}>
      {text}
    </span>
  );
}

export function YearTable({ years, rows }: { years: SabiYear[]; rows: { label: string; unit: Unit; values: Array<number | null> }[] }) {
  return (
    <table className="w-full min-w-[28rem] text-left text-xs">
      <thead className="bg-[#f7f8fb] text-[#5c6b78]">
        <tr>
          <th className="px-3 py-2 font-semibold">Concepto</th>
          {years.map((year) => (
            <th key={year.year} className="px-3 py-2 text-right font-semibold tabular-nums">
              {yearLabel(year)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-[#eef0f4] text-[#1c2740]">
            <td className="px-3 py-1.5">{row.label}</td>
            {row.values.map((value, index) => (
              <td key={index} className="px-3 py-1.5 text-right tabular-nums">
                {value === null ? "—" : formatValue(value, row.unit)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- charts ---------- */

export type Series = { label: string; color: string; values: Array<number | null> };

export function ColumnBars({ years, series, unit }: { years: SabiYear[]; series: Series[]; unit: Unit }) {
  const all = series.flatMap((item) => item.values).filter((value): value is number => value !== null);
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const zero = (-min / range) * 100;

  return (
    <div>
      <div className="relative h-44">
        <div className="absolute inset-x-0 border-t border-[#c9d0da]" style={{ bottom: `${zero}%` }} aria-hidden />
        <div className="absolute inset-0 flex gap-2 sm:gap-4">
          {years.map((year, yearIndex) => (
            <div key={year.year} className="flex h-full min-w-0 flex-1 justify-center gap-1">
              {series.map((item) => {
                const value = item.values[yearIndex] ?? null;
                if (value === null) {
                  return <div key={item.label} className="relative h-full max-w-8 flex-1" aria-hidden />;
                }

                const height = Math.max((Math.abs(value) / range) * 100, 0.8);
                const style = value >= 0 ? { bottom: `${zero}%`, height: `${height}%` } : { top: `${100 - zero}%`, height: `${height}%` };
                return (
                  <div key={item.label} className="relative h-full max-w-8 flex-1">
                    <div
                      tabIndex={0}
                      aria-label={`${year.year} · ${item.label}: ${formatValue(value, unit)}`}
                      className="group absolute inset-x-0 rounded-[3px] outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                      style={{ ...style, backgroundColor: value < 0 && series.length === 1 ? loss : item.color }}
                    >
                      <Tip text={`${yearLabel(year)} · ${item.label}: ${formatValue(value, unit)}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex gap-2 text-center text-[11px] text-[#5c6b78] tabular-nums sm:gap-4">
        {years.map((year) => (
          <span key={year.year} className="min-w-0 flex-1 truncate">
            {yearLabel(year)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Percent charts are cut at ±100 % so one start-up year with tiny revenue (e.g. −13.000 %) does not flatten the rest; cut points are drawn hollow. */
const pctLimit = 100;

function clampFor(unit: Unit, value: number): number {
  return unit === "pct" ? Math.max(-pctLimit, Math.min(pctLimit, value)) : value;
}

export function LineChart({ years, series, unit }: { years: SabiYear[]; series: Series[]; unit: Unit }) {
  const all = series.flatMap((item) => item.values).filter((value): value is number => value !== null).map((value) => clampFor(unit, value));
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const x = (index: number) => (years.length === 1 ? 50 : 6 + (index / (years.length - 1)) * 88);
  const y = (value: number) => ((max - value) / range) * 100;

  return (
    <div>
      <div className="relative h-44">
        <span className="absolute top-0 left-0 text-[10px] text-[#8b95a7] tabular-nums">{formatValue(max, unit)}</span>
        <span className="absolute bottom-0 left-0 text-[10px] text-[#8b95a7] tabular-nums">{formatValue(min, unit)}</span>
        <div className="absolute inset-x-0 border-t border-dashed border-[#c9d0da]" style={{ top: `${y(0)}%` }} aria-hidden />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {series.map((item) => {
            const points = item.values
              .map((value, index) => (value === null ? null : `${x(index)},${y(clampFor(unit, value))}`))
              .filter((point): point is string => point !== null);
            return <polyline key={item.label} points={points.join(" ")} fill="none" stroke={item.color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />;
          })}
        </svg>
        {series.map((item) =>
          item.values.map((value, index) => {
            if (value === null) {
              return null;
            }

            const shown = clampFor(unit, value);
            const cut = shown !== value;
            const text = `${yearLabel(years[index]!)} · ${item.label}: ${formatValue(value, unit)}${cut ? " (fuera de escala)" : ""}`;
            return (
              <div
                key={`${item.label}-${index}`}
                tabIndex={0}
                aria-label={text}
                className="group absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow outline-none focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                style={{ left: `${x(index)}%`, top: `${y(shown)}%`, backgroundColor: cut ? "#ffffff" : item.color, borderColor: cut ? item.color : "#ffffff" }}
              >
                <Tip text={text} />
              </div>
            );
          }),
        )}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-[#5c6b78] tabular-nums">
        {years.map((year, index) => (
          <span key={year.year} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(index)}%` }}>
            {yearLabel(year)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BalanceStacks({ years }: { years: SabiYear[] }) {
  const usable = years.filter((year) => year.totalAssetsCents !== null && year.totalAssetsCents > 0);
  const max = Math.max(...usable.map((year) => year.totalAssetsCents!), 1);
  const segment = (label: string, color: string, value: number | null, year: SabiYear) =>
    value === null || value <= 0 ? null : (
      <div
        key={label}
        tabIndex={0}
        aria-label={`${year.year} · ${label}: ${formatCompactEur(value)}`}
        className="group relative w-full outline-none first:rounded-t-[3px] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
        style={{ height: `${(value / max) * 100}%`, backgroundColor: color }}
      >
        <Tip text={`${yearLabel(year)} · ${label}: ${formatCompactEur(value)} (${decimal.format((value / year.totalAssetsCents!) * 100)} %)`} />
      </div>
    );

  return (
    <div>
      <div className="flex h-48 gap-3 sm:gap-6">
        {usable.map((year) => (
          <div key={year.year} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1">
            <div className="flex h-full w-full max-w-10 flex-col justify-end">
              {segment("Activo no corriente", navy, year.nonCurrentAssetsCents, year)}
              {segment("Activo corriente", "#5b6b8c", year.currentAssetsCents, year)}
            </div>
            <div className="flex h-full w-full max-w-10 flex-col justify-end">
              {segment("Pasivo corriente", tealLight, year.currentLiabilitiesCents, year)}
              {segment("Pasivo no corriente", tealMid, year.nonCurrentLiabilitiesCents, year)}
              {segment("Patrimonio neto", teal, year.equityCents, year)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3 text-center text-[11px] text-[#5c6b78] tabular-nums sm:gap-6">
        {usable.map((year) => (
          <span key={year.year} className="min-w-0 flex-1 truncate">
            {yearLabel(year)}
            <span className="block text-[10px] text-[#8b95a7]">Activo · Pasivo</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function waterfallBars(steps: WaterfallStep[]) {
  const bars: Array<WaterfallStep & { from: number; to: number }> = [];
  let running = 0;
  for (const step of steps) {
    if (step.kind === "delta") {
      bars.push({ ...step, from: running, to: running + step.value });
      running += step.value;
    } else {
      bars.push({ ...step, from: 0, to: step.value });
      running = step.value;
    }
  }

  return bars;
}

export function Waterfall({ year }: { year: SabiYear }) {
  const bars = waterfallBars(pnlWaterfall(year));
  const points = bars.flatMap((bar) => [bar.from, bar.to]);
  const max = Math.max(0, ...points);
  const min = Math.min(0, ...points);
  const range = max - min || 1;
  const pos = (value: number) => ((value - min) / range) * 100;

  return (
    <ul className="flex flex-col gap-1.5">
      {bars.map((bar) => {
        const left = pos(Math.min(bar.from, bar.to));
        const width = Math.max(pos(Math.max(bar.from, bar.to)) - left, 0.6);
        const color = bar.kind === "delta" ? (bar.value < 0 ? loss : tealMid) : bar.to < 0 ? loss : bar.kind === "start" ? navy : teal;
        const strong = bar.kind !== "delta";
        return (
          <li key={bar.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 text-xs sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5rem]">
            <span className={strong ? "truncate font-semibold text-[#1c2740]" : "truncate pl-2 text-[#5c6b78]"} title={bar.label}>
              {bar.label}
            </span>
            <span className="relative order-last col-span-2 h-5 rounded bg-[#f4f6f9] sm:order-none sm:col-span-1">
              <span className="absolute inset-y-0 border-l border-[#c9d0da]" style={{ left: `${pos(0)}%` }} aria-hidden />
              <span
                tabIndex={0}
                aria-label={`${bar.label}: ${formatCompactEur(bar.value)}`}
                className="group absolute inset-y-0.5 rounded-[3px] outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color, opacity: strong ? 1 : 0.85 }}
              >
                <Tip text={`${bar.label}: ${formatCompactEur(bar.value)}`} />
              </span>
            </span>
            <span className={`text-right whitespace-nowrap tabular-nums ${bar.value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"} ${strong ? "font-semibold" : ""}`}>
              {bar.kind === "delta" && bar.value > 0 ? "+" : ""}
              {formatCompactEur(bar.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Sparkline({ values, color, unit }: { values: Array<number | null>; color: string; unit: Unit }) {
  const present = values.map((value, index) => ({ value: value === null ? null : clampFor(unit, value), index })).filter((point): point is { value: number; index: number } => point.value !== null);
  if (present.length < 2) {
    return null;
  }

  const max = Math.max(...present.map((point) => point.value));
  const min = Math.min(...present.map((point) => point.value));
  const range = max - min || 1;
  const x = (index: number) => (values.length === 1 ? 50 : (index / (values.length - 1)) * 100);
  const y = (value: number) => 4 + ((max - value) / range) * 22;
  const last = present[present.length - 1]!;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <polyline points={present.map((point) => `${x(point.index)},${y(point.value)}`).join(" ")} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(last.index)} cy={y(last.value)} r={2.2} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export type Metric = { key: string; label: string; unit: Unit; better: "up" | "down" | "none"; hint: string; values: Array<number | null> };

export function KpiTile({ metric, years }: { metric: Metric; years: SabiYear[] }) {
  const lastIndex = metric.values.findLastIndex((value) => value !== null);
  const value = lastIndex >= 0 ? metric.values[lastIndex]! : null;
  const change = yearOverYear(metric.values);
  const good = change && metric.better !== "none" && change.delta !== 0 ? (change.delta > 0) === (metric.better === "up") : null;
  const chip = good === null ? "bg-[#eef0f4] text-[#3d4a63]" : good ? "bg-[#e6f4f2] text-[#0f5f59]" : "bg-[#fdecec] text-[#a12f2f]";

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-3">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs leading-4 font-medium text-[#5c6b78]">{metric.label}</span>
        <FieldHint text={metric.hint} align="end" wide />
      </div>
      <span className={`mt-1 text-lg font-semibold tabular-nums ${value !== null && value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"}`}>
        {value === null ? "—" : formatValue(value, metric.unit)}
      </span>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#8b95a7]">
        {lastIndex >= 0 ? <span className="tabular-nums">{yearLabel(years[lastIndex]!)}</span> : null}
        {change ? (
          <span className={`rounded-full px-1.5 py-0.5 font-medium tabular-nums ${chip}`} title="Variación frente al ejercicio anterior con dato">
            {change.delta > 0 ? "▲" : change.delta < 0 ? "▼" : "="} {formatDelta(change.delta, change.previous, metric.unit)}
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-2">
        <Sparkline values={metric.values} color={teal} unit={metric.unit} />
      </div>
    </div>
  );
}

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

/* ---------- registry sections ---------- */

export function Section({ icon, title, count, hint, children }: { icon: ReactNode; title: string; count?: number; hint?: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1c2740]">
        {icon}
        {title}
        {count !== undefined ? <span className="rounded-full bg-[#e6f4f2] px-2 py-0.5 text-xs font-medium text-[#0f5f59]">{count}</span> : null}
        {hint ? <FieldHint text={hint} wide /> : null}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Toggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        className="rounded-lg px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
      >
        {open ? reportChartsCopy.hideTable : label}
      </button>
      {open ? <div className="mt-2 overflow-x-auto rounded-lg border border-[#eef0f4]">{children}</div> : null}
    </div>
  );
}

export function HoldingTable({ rows }: { rows: SabiHolding[] }) {
  return (
    <table className="w-full min-w-[30rem] text-left text-xs">
      <thead className="bg-[#f7f8fb] text-[#5c6b78]">
        <tr>
          <th className="px-3 py-2 font-semibold">Nombre</th>
          <th className="px-3 py-2 font-semibold">País</th>
          <th className="px-3 py-2 font-semibold">Tipo</th>
          <th className="px-3 py-2 text-right font-semibold">% directo</th>
          <th className="px-3 py-2 text-right font-semibold">% total</th>
          <th className="px-3 py-2 font-semibold">Fecha info.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.name}-${index}`} className="border-t border-[#eef0f4] text-[#1c2740]">
            <td className="px-3 py-1.5 font-medium">{row.name}</td>
            <td className="px-3 py-1.5">{row.country ?? "—"}</td>
            <td className="px-3 py-1.5">{row.type ?? "—"}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{row.direct ?? "—"}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{row.total ?? "—"}</td>
            <td className="px-3 py-1.5 tabular-nums">{isoDay(row.infoDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function initials(name: string): string {
  return name
    .replace(/^(MR|MRS|MS|DR|D|DÑA|DOÑA|DON)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function People({ directors }: { directors: SabiPerson[] }) {
  const people = new Map<string, { name: string; roles: string[]; since: string | null; group: string | null }>();
  for (const person of directors) {
    const entry = people.get(person.name) ?? { name: person.name, roles: [], since: person.since, group: person.group };
    if (person.role && !entry.roles.includes(person.role)) {
      entry.roles.push(person.role);
    }

    if (person.since && (!entry.since || person.since < entry.since)) {
      entry.since = person.since;
    }

    people.set(person.name, entry);
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {[...people.values()].map((person) => (
        <li key={person.name} className="flex min-w-0 items-start gap-3 rounded-lg bg-[#f7f8fb] p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-xs font-semibold text-white" aria-hidden>
            {initials(person.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#1c2740]" title={person.name}>
              {person.name}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {person.roles.map((role) => (
                <span key={role} className="rounded-full bg-[#e6f4f2] px-2 py-0.5 text-[11px] font-medium text-[#0f5f59]">
                  {role}
                </span>
              ))}
            </div>
            {person.since || person.group ? (
              <p className="mt-1 text-[11px] text-[#5c6b78]">{[person.since ? `Desde ${isoDay(person.since)}` : null, person.group].filter(Boolean).join(" · ")}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ text = reportChartsCopy.noData }: { text?: string }) {
  return <p className="text-sm text-[#5c6b78]">{text}</p>;
}

const levelColors = { good: "#2fa58f", warn: "#e3a63b", bad: "#d25454" } as const;
const levelText = { good: "Bien", warn: "Vigilar", bad: "Riesgo" } as const;
const levelChip = { good: "bg-[#e6f4f2] text-[#0f5f59]", warn: "bg-[#fdf3e1] text-[#8a5a0b]", bad: "bg-[#fdecec] text-[#a12f2f]" } as const;

/** Traffic-light gauge: coloured zones on a track, a marker at the value and the plain-language reading below. */
export function SignalGauge({ signal }: { signal: HealthSignal }) {
  const span = signal.max - signal.min || 1;
  const pos = (value: number) => Math.min(100, Math.max(0, ((value - signal.min) / span) * 100));
  const ends = signal.zones.map((zone) => (zone.upTo === Infinity ? 100 : pos(zone.upTo)));
  const zones = signal.zones.map((zone, index) => ({ level: zone.level, width: Math.max(ends[index]! - (index > 0 ? ends[index - 1]! : 0), 0) }));

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
          {signal.label}
          <FieldHint text={`${signal.hint}\n${signal.scale}`} wide />
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelChip[signal.level]}`}>{levelText[signal.level]}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#1c2740] tabular-nums">
        {signal.display} <span className="text-xs font-normal text-[#8b95a7]">{signal.year}</span>
      </p>
      <div className="relative mt-3 h-2.5" role="img" aria-label={`${signal.label}: ${signal.display}. ${signal.scale}`}>
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          {zones.map((zone, index) => (
            <span key={index} className="h-full" style={{ width: `${zone.width}%`, backgroundColor: levelColors[zone.level], opacity: zone.level === signal.level ? 1 : 0.35 }} />
          ))}
        </div>
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow" style={{ left: `${pos(signal.value)}%`, backgroundColor: levelColors[signal.level] }} aria-hidden />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#3d4a63]">{signal.reading}</p>
    </section>
  );
}
