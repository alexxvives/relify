"use client";

import { Building2, Landmark, ShieldCheck, Tags, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FieldHint } from "@/components/field-hint";
import { ShareDonut } from "@/components/share-donut";
import { Card } from "@/components/ui/form";
import { tooltipBubble } from "@/components/ui/info-hint";
import { formatCompactEur } from "@/lib/money";
import {
  financialDebtCents,
  marginPercent,
  netDebtCents,
  netDebtToEbitda,
  pnlWaterfall,
  sabiOwnershipSlices,
  yearOverYear,
  type SabiYear,
  type WaterfallStep,
} from "@/lib/sabi/insights";
import type { SabiHolding, SabiPerson } from "@/lib/sabi/parse";
import type { SabiRegistry } from "@/lib/sabi/registry";

/** t68: the SABI import as charts first (trends, balance, P&L bridge, ratios, ownership, people), tables behind "Ver tabla". */
export const sabiInsightsCopy = {
  title: "Análisis SABI",
  intro: "Cuentas depositadas y registro mercantil importados de SABI. Pasa el ratón (o toca) los iconos ⓘ para ver qué significa cada dato y cómo se calcula.",
  showTable: "Ver tabla",
  hideTable: "Ocultar tabla",
  noData: "Sin datos en el informe SABI.",
};

const navy = "#1c2740";
const teal = "#0f766e";
const tealMid = "#2fc4b2";
const tealLight = "#7fd6cc";
const loss = "#c23b3b";

const schemeLabels: Record<string, string> = {
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

type Unit = "eur" | "pct" | "x" | "days" | "keur" | "people";

function formatValue(value: number, unit: Unit): string {
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

function isoDay(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const [year, month, day] = iso.split("-");
  return day ? `${day}/${month}/${year}` : iso;
}

function yearLabel(year: SabiYear): string {
  return year.months !== null && year.months !== 12 ? `${year.year} (${year.months} m)` : String(year.year);
}

/* ---------- shared bits ---------- */

function ChartBox({ title, hint, legend, table, children }: { title: string; hint?: string; legend?: ReactNode; table?: ReactNode; children: ReactNode }) {
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
            {open ? sabiInsightsCopy.hideTable : sabiInsightsCopy.showTable}
          </button>
        ) : null}
      </div>
      {legend ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5c6b78]">{legend}</div> : null}
      <div className="mt-3">{children}</div>
      {table && open ? <div className="mt-4 overflow-x-auto rounded-lg border border-[#eef0f4]">{table}</div> : null}
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
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

function YearTable({ years, rows }: { years: SabiYear[]; rows: { label: string; unit: Unit; values: Array<number | null> }[] }) {
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

type Series = { label: string; color: string; values: Array<number | null> };

function ColumnBars({ years, series, unit }: { years: SabiYear[]; series: Series[]; unit: Unit }) {
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

function LineChart({ years, series, unit }: { years: SabiYear[]; series: Series[]; unit: Unit }) {
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

function BalanceStacks({ years }: { years: SabiYear[] }) {
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

function Waterfall({ year }: { year: SabiYear }) {
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

function Sparkline({ values, color, unit }: { values: Array<number | null>; color: string; unit: Unit }) {
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

type Metric = { key: string; label: string; unit: Unit; better: "up" | "down" | "none"; hint: string; values: Array<number | null> };

function KpiTile({ metric, years }: { metric: Metric; years: SabiYear[] }) {
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

function metrics(years: SabiYear[]): { kpis: Metric[]; debt: Metric[] } {
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

function Section({ icon, title, count, hint, children }: { icon: ReactNode; title: string; count?: number; hint?: string; children: ReactNode }) {
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

function Toggle({ label, children }: { label: string; children: ReactNode }) {
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
        {open ? sabiInsightsCopy.hideTable : label}
      </button>
      {open ? <div className="mt-2 overflow-x-auto rounded-lg border border-[#eef0f4]">{children}</div> : null}
    </div>
  );
}

function HoldingTable({ rows }: { rows: SabiHolding[] }) {
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

function People({ directors }: { directors: SabiPerson[] }) {
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

function Empty() {
  return <p className="text-sm text-[#5c6b78]">{sabiInsightsCopy.noData}</p>;
}

/* ---------- main ---------- */

export function SabiInsights({ registry }: { registry: SabiRegistry }) {
  const years = registry.years;
  const latest = [...years].reverse().find((year) => pnlWaterfall(year).length > 0) ?? null;
  const { kpis, debt } = metrics(years);
  const trend: Series[] = [
    { label: "Ingresos de explotación", color: navy, values: years.map((year) => year.revenueCents) },
    { label: "EBITDA", color: teal, values: years.map((year) => year.ebitdaCents) },
    { label: "Resultado del ejercicio", color: tealLight, values: years.map((year) => year.netResultCents) },
  ].filter((item) => item.values.some((value) => value !== null));
  const margins: Series[] = [
    { label: "Margen EBITDA", color: teal, values: years.map((year) => marginPercent(year.ebitdaCents, year.revenueCents)) },
    { label: "Margen neto", color: navy, values: years.map((year) => marginPercent(year.netResultCents, year.revenueCents)) },
  ].filter((item) => item.values.some((value) => value !== null));
  const employees = years.map((year) => year.employees);
  const hasBalance = years.some((year) => year.totalAssetsCents !== null && year.totalAssetsCents > 0);
  const ownership = sabiOwnershipSlices(registry.shareholdings);
  const schemes = Object.entries(registry.activityCodes).filter(([, set]) => set && set.primary.length + set.secondary.length > 0);

  return (
    <Card id="panel-sabi-registry" className="scroll-mt-6">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sabiInsightsCopy.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{sabiInsightsCopy.intro}</p>

      <div className="mt-5 flex flex-col gap-4">
        {kpis.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">Indicadores clave</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {kpis.map((metric) => (
                <KpiTile key={metric.key} metric={metric} years={years} />
              ))}
            </div>
          </div>
        ) : null}

        {trend.length > 0 || margins.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {trend.length > 0 ? (
              <ChartBox
                title="Evolución de ingresos y resultados"
                hint={"Ingresos de explotación, EBITDA (resultado antes de amortizaciones, intereses e impuestos) y resultado final de cada ejercicio depositado. Las barras rojas o por debajo de la línea son pérdidas."}
                legend={trend.map((item) => (
                  <LegendDot key={item.label} color={item.color} label={item.label} />
                ))}
                table={<YearTable years={years} rows={trend.map((item) => ({ label: item.label, unit: "eur", values: item.values }))} />}
              >
                <ColumnBars years={years} series={trend} unit="eur" />
              </ChartBox>
            ) : null}
            {margins.length > 0 ? (
              <ChartBox
                title="Márgenes"
                hint={"Margen EBITDA = EBITDA ÷ ingresos de explotación.\nMargen neto = resultado del ejercicio ÷ ingresos de explotación.\nIndican cuánto de cada euro vendido se convierte en beneficio."}
                legend={margins.map((item) => (
                  <LegendDot key={item.label} color={item.color} label={item.label} />
                ))}
                table={<YearTable years={years} rows={margins.map((item) => ({ label: item.label, unit: "pct", values: item.values }))} />}
              >
                <LineChart years={years} series={margins} unit="pct" />
              </ChartBox>
            ) : null}
          </div>
        ) : null}

        {hasBalance || latest ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {hasBalance ? (
              <ChartBox
                title="Estructura del balance"
                hint={"Para cada año, la barra izquierda es lo que la empresa tiene (activo) y la derecha cómo se financia (patrimonio neto y deudas). Ambas suman lo mismo."}
                legend={[
                  <LegendDot key="anc" color={navy} label="Activo no corriente" />,
                  <LegendDot key="ac" color="#5b6b8c" label="Activo corriente" />,
                  <LegendDot key="pn" color={teal} label="Patrimonio neto" />,
                  <LegendDot key="pnc" color={tealMid} label="Pasivo no corriente" />,
                  <LegendDot key="pc" color={tealLight} label="Pasivo corriente" />,
                ]}
                table={
                  <YearTable
                    years={years}
                    rows={[
                      { label: "Activo no corriente", unit: "eur", values: years.map((year) => year.nonCurrentAssetsCents) },
                      { label: "Activo corriente", unit: "eur", values: years.map((year) => year.currentAssetsCents) },
                      { label: "Total activo", unit: "eur", values: years.map((year) => year.totalAssetsCents) },
                      { label: "Patrimonio neto", unit: "eur", values: years.map((year) => year.equityCents) },
                      { label: "Pasivo no corriente", unit: "eur", values: years.map((year) => year.nonCurrentLiabilitiesCents) },
                      { label: "Pasivo corriente", unit: "eur", values: years.map((year) => year.currentLiabilitiesCents) },
                    ]}
                  />
                }
              >
                <BalanceStacks years={years} />
              </ChartBox>
            ) : null}
            {latest ? (
              <ChartBox
                title={`De ingresos a resultado · ${yearLabel(latest)}`}
                hint={"Cascada de la cuenta de resultados del último ejercicio: parte de los ingresos y resta cada gasto hasta llegar al resultado final. Los subtotales (EBITDA, EBIT, resultado antes de impuestos) son los publicados por SABI."}
                table={
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {pnlWaterfall(latest).map((step) => (
                        <tr key={step.label} className="border-t border-[#eef0f4] text-[#1c2740] first:border-t-0">
                          <td className={`px-3 py-1.5 ${step.kind === "delta" ? "" : "font-semibold"}`}>{step.label}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{formatCompactEur(step.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <Waterfall year={latest} />
              </ChartBox>
            ) : null}
          </div>
        ) : null}

        {debt.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#1c2740]">Deuda y liquidez</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-5">
              {debt.map((metric) => (
                <KpiTile key={metric.key} metric={metric} years={years} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {employees.some((value) => value !== null) ? (
            <ChartBox
              title="Empleados"
              hint="Plantilla media declarada en las cuentas de cada ejercicio."
              table={<YearTable years={years} rows={[{ label: "Empleados", unit: "people", values: employees }]} />}
            >
              <ColumnBars years={years} series={[{ label: "Empleados", color: teal, values: employees }]} unit="people" />
            </ChartBox>
          ) : null}
          <Section
            icon={<Users className="size-4 text-[#0f766e]" aria-hidden />}
            title="Accionistas"
            count={registry.shareholdings.length}
            hint={"Reparto del capital según SABI. \u201c> 50 %\u201d significa que SABI solo publica que supera el 50 %; el resto agrupa a los accionistas sin porcentaje publicado. El tipo es el código de SABI tal cual."}
          >
            {registry.shareholdings.length === 0 ? (
              <Empty />
            ) : (
              <>
                {ownership.length > 0 ? (
                  <div className="[&>section]:h-auto">
                    <ShareDonut title="Reparto del capital" slices={ownership} palette="capital" />
                  </div>
                ) : null}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {registry.shareholdings.map((holder, index) => (
                    <li key={`${holder.name}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f4f6f9] px-2.5 py-1 text-xs text-[#1c2740]">
                      <span className="truncate">{holder.name}</span>
                      {holder.type ? <span className="rounded bg-white px-1 text-[10px] font-semibold text-[#5c6b78]">{holder.type}</span> : null}
                      {holder.direct ?? holder.total ? <span className="font-medium tabular-nums text-[#0f5f59]">{holder.direct ?? holder.total} %</span> : null}
                    </li>
                  ))}
                </ul>
                <Toggle label={sabiInsightsCopy.showTable}>
                  <HoldingTable rows={registry.shareholdings} />
                </Toggle>
              </>
            )}
          </Section>
        </div>

        <Section icon={<Users className="size-4 text-[#0f766e]" aria-hidden />} title="Administradores y directivos" count={new Set(registry.directors.map((person) => person.name)).size}>
          {registry.directors.length === 0 ? <Empty /> : <People directors={registry.directors} />}
        </Section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Section icon={<Building2 className="size-4 text-[#0f766e]" aria-hidden />} title="Participadas" count={registry.subsidiaries.length} hint="Sociedades en las que la empresa tiene participación, con el % directo y total publicado por SABI.">
            {registry.subsidiaries.length === 0 ? (
              <Empty />
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {registry.subsidiaries.map((holding, index) => (
                    <li key={`${holding.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f8fb] px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#1c2740]">{holding.name}</span>
                        <span className="text-[11px] text-[#5c6b78]">{[holding.country, holding.type].filter(Boolean).join(" · ") || "—"}</span>
                      </span>
                      {holding.direct ?? holding.total ? (
                        <span className="shrink-0 rounded-full bg-[#e6f4f2] px-2 py-0.5 text-xs font-semibold text-[#0f5f59] tabular-nums">{holding.direct ?? holding.total} %</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <Toggle label={sabiInsightsCopy.showTable}>
                  <HoldingTable rows={registry.subsidiaries} />
                </Toggle>
              </>
            )}
          </Section>
          <Section icon={<ShieldCheck className="size-4 text-[#0f766e]" aria-hidden />} title="Auditoría por ejercicio" count={registry.audits.length}>
            {registry.audits.length === 0 ? (
              <Empty />
            ) : (
              <ol className="relative ml-1.5 border-l border-[#d5dbe3]">
                {[...registry.audits]
                  .sort((a, b) => b.year - a.year)
                  .map((audit) => (
                    <li key={audit.year} className="relative pb-3 pl-4 last:pb-0">
                      <span className="absolute top-1 -left-[5px] size-2.5 rounded-full bg-[#0f766e]" aria-hidden />
                      <p className="text-sm font-medium text-[#1c2740] tabular-nums">
                        {audit.year} <span className="text-xs font-normal text-[#5c6b78]">· cierre {isoDay(audit.closingOn)}</span>
                      </p>
                      <p className="text-xs text-[#5c6b78]">{[audit.opinion, audit.auditorName, audit.auditorCode].filter(Boolean).join(" · ") || "Sin datos de auditoría"}</p>
                    </li>
                  ))}
              </ol>
            )}
          </Section>
          <Section icon={<Landmark className="size-4 text-[#0f766e]" aria-hidden />} title="Bancos" count={registry.banks.length}>
            {registry.banks.length === 0 ? (
              <Empty />
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {registry.banks.map((bank) => (
                  <li key={bank} className="rounded-lg bg-[#f7f8fb] px-2.5 py-1.5 text-xs font-medium text-[#1c2740]">
                    {bank}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {schemes.length > 0 ? (
          <Section icon={<Tags className="size-4 text-[#0f766e]" aria-hidden />} title="Códigos de actividad">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {schemes.map(([scheme, set]) => (
                <div key={scheme} className="min-w-0">
                  <dt className="text-xs font-medium text-[#5c6b78]">{schemeLabels[scheme] ?? scheme.toUpperCase()}</dt>
                  <dd className="text-[#1c2740]">
                    {[...set!.primary.map((code) => ({ ...code, main: true })), ...set!.secondary.map((code) => ({ ...code, main: false }))].map((code, index) => (
                      <span key={`${code.code}-${index}`} className="block">
                        <span className="font-medium tabular-nums">{code.code}</span> {code.description}
                        {code.main ? <span className="ml-1 text-xs text-[#0f766e]">principal</span> : null}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}
      </div>
    </Card>
  );
}
