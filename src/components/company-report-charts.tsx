"use client";

import { formatHoldingPercent, holderTypeLabel, topShareholders } from "@/lib/sabi/holders";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FieldHint } from "@/components/field-hint";
import { placeBubble, tooltipBox, tooltipBubble } from "@/components/ui/info-hint";
import {
  pnlWaterfall,
  yearOverYear,
  type SabiYear,
  type WaterfallStep,
} from "@/lib/sabi/insights";
import type { HealthSignal } from "@/lib/company-report";
import {
  compactEur,
  isComparableBase,
  notSignificant,
  notSignificantHint,
  decimal,
  formatDelta,
  isoDay,
  formatValue,
  loss,
  navy,
  reportChartsCopy,
  teal,
  tealLight,
  tealMid,
  yearLabel,
  type Metric,
  type Unit,
} from "@/lib/report-format";
import type { SabiHolding, SabiPerson } from "@/lib/sabi/parse";


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

/**
 * t71: chart tooltip. Rendered in a portal with fixed coordinates (like InfoHint) so it wraps at 240–360 px and is
 * never clipped by the chart box; it opens on hover or keyboard focus of its parent bar/point.
 */
export function ChartTip({ text }: { text: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const host = marker.current?.parentElement;
    if (!host) {
      return;
    }
    const show = () => setOpen(true);
    const hide = () => {
      setOpen(false);
      setPos(null);
    };
    host.addEventListener("mouseenter", show);
    host.addEventListener("mouseleave", hide);
    host.addEventListener("focus", show);
    host.addEventListener("blur", hide);
    return () => {
      host.removeEventListener("mouseenter", show);
      host.removeEventListener("mouseleave", hide);
      host.removeEventListener("focus", show);
      host.removeEventListener("blur", hide);
    };
  }, []);

  useLayoutEffect(() => {
    const anchor = marker.current?.parentElement?.getBoundingClientRect();
    const box = bubble.current?.getBoundingClientRect();
    if (open && anchor && box && pos === null) {
      setPos(placeBubble(anchor, box));
    }
  }, [open, pos]);

  return (
    <span ref={marker} hidden>
      {open && typeof document !== "undefined"
        ? createPortal(
            <span ref={bubble} role="tooltip" style={tooltipBox(pos)} className={`pointer-events-none z-[100] ${tooltipBubble}`}>
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function YearTable({ years, rows }: { years: SabiYear[]; rows: { label: string; unit: Unit; values: Array<number | null>; ns?: boolean[] }[] }) {
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
                {row.ns?.[index] ? <NotSignificant /> : value === null ? "—" : formatValue(value, row.unit)}
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
        {/* t81: equal slots without flex gap, so each year sits at (i + 0.5) / n like LineChart's slot mode. */}
        <div className="absolute inset-0 flex">
          {years.map((year, yearIndex) => (
            <div key={year.year} className="flex h-full min-w-0 flex-1 justify-center gap-1 px-1 sm:px-2">
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
                      className="group/tip absolute inset-x-0 rounded-[3px] outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                      style={{ ...style, backgroundColor: value < 0 && series.length === 1 ? loss : item.color }}
                    >
                      <ChartTip text={`${yearLabel(year)} · ${item.label}: ${formatValue(value, unit)}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex text-center text-[11px] text-[#5c6b78] tabular-nums">
        {years.map((year) => (
          <span key={year.year} className="min-w-0 flex-1 truncate px-1">
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

export function LineChart({ years, series, unit, slots = false }: { years: SabiYear[]; series: Series[]; unit: Unit; /** t81: place years at slot centres, same x as ColumnBars beside it. */ slots?: boolean }) {
  const all = series.flatMap((item) => item.values).filter((value): value is number => value !== null).map((value) => clampFor(unit, value));
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const x = (index: number) => (slots ? ((index + 0.5) / years.length) * 100 : years.length === 1 ? 50 : 6 + (index / (years.length - 1)) * 88);
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
                className="group/tip absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow outline-none focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                style={{ left: `${x(index)}%`, top: `${y(shown)}%`, backgroundColor: cut ? "#ffffff" : item.color, borderColor: cut ? item.color : "#ffffff" }}
              >
                <ChartTip text={text} />
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
        aria-label={`${year.year} · ${label}: ${compactEur(value)}`}
        className="group/tip relative w-full outline-none first:rounded-t-[3px] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
        style={{ height: `${(value / max) * 100}%`, backgroundColor: color }}
      >
        <ChartTip text={`${yearLabel(year)} · ${label}: ${compactEur(value)} (${decimal.format((value / year.totalAssetsCents!) * 100)} %)`} />
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

const pctOfRevenue = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 0 });

/**
 * t73: P&L bridge with a year toggle. Each row shows the amount and its share of revenue; positive
 * steps are teal, negative steps red, subtotals navy-teal, and the final result is highlighted.
 * Dashed connectors carry the running total from one bar to the next.
 */
export function Waterfall({ years }: { years: SabiYear[] }) {
  const usable = years.filter((year) => pnlWaterfall(year).length > 0);
  const [picked, setPicked] = useState<number | null>(null);
  const year = usable.find((item) => item.year === picked) ?? usable.at(-1);
  if (!year) {
    return null;
  }

  const bars = waterfallBars(pnlWaterfall(year));
  const revenue = year.revenueCents ?? 0;
  const points = bars.flatMap((bar) => [bar.from, bar.to]);
  const max = Math.max(0, ...points);
  const min = Math.min(0, ...points);
  const range = max - min || 1;
  const pos = (value: number) => ((value - min) / range) * 100;
  const share = (value: number) => (revenue > 0 ? `${pctOfRevenue.format((value / revenue) * 100)} %` : null);

  return (
    <div className="flex flex-col gap-3">
      {usable.length > 1 ? (
        <div role="radiogroup" aria-label="Ejercicio" className="flex flex-wrap justify-center gap-1.5">
          {usable.map((item) => {
            const active = item.year === year.year;
            return (
              <button
                key={item.year}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(item.year)}
                className={`h-7 rounded-full border px-3 text-xs font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                  active ? "border-[#1c2740] bg-[#1c2740] text-white" : "border-[#e1e5eb] bg-white text-[#3d4a63] hover:border-[#2fc4b2] hover:text-[#0f766e]"
                }`}
              >
                {yearLabel(item)}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5c6b78]">
        <LegendDot color={navy} label="Ingresos" />
        <LegendDot color={tealMid} label="Suma" />
        <LegendDot color={loss} label="Resta" />
        <LegendDot color={teal} label="Subtotal" />
      </div>
      <ul className="flex flex-col gap-2">
        {bars.map((bar, index) => {
          const left = pos(Math.min(bar.from, bar.to));
          const width = Math.max(pos(Math.max(bar.from, bar.to)) - left, 0.6);
          const final = index === bars.length - 1;
          const color = bar.kind === "delta" ? (bar.value < 0 ? loss : tealMid) : bar.kind === "start" ? navy : bar.to < 0 ? loss : teal;
          const strong = bar.kind !== "delta";
          const pct = share(bar.value);
          const amount = `${bar.kind === "delta" && bar.value > 0 ? "+" : ""}${compactEur(bar.value)}`;
          const text = `${bar.label}: ${amount}${pct ? ` (${pct} de los ingresos)` : ""}`;
          return (
            <li
              key={bar.label}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg text-xs sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_7.5rem] ${
                final ? `-mx-2 px-2 py-2 ring-1 ${bar.value < 0 ? "bg-[#fdf3f3] ring-[#f3c9c9]" : "bg-[#eef8f6] ring-[#bfe6df]"}` : ""
              }`}
            >
              <span className={strong ? "truncate font-semibold text-[#1c2740]" : "truncate pl-3 text-[#5c6b78]"} title={bar.label}>
                {bar.kind === "delta" ? <span className="mr-1 text-[#8b95a7]" aria-hidden>{bar.value < 0 ? "−" : "+"}</span> : null}
                {bar.label}
              </span>
              <span className={`relative order-last col-span-2 rounded bg-[#f4f6f9] sm:order-none sm:col-span-1 ${final ? "h-7" : "h-6"}`}>
                <span className="absolute inset-y-0 border-l border-[#c9d0da]" style={{ left: `${pos(0)}%` }} aria-hidden />
                <span
                  tabIndex={0}
                  aria-label={text}
                  className="absolute inset-y-0.5 rounded-[3px] outline-none hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
                >
                  <ChartTip text={text} />
                </span>
                {final ? null : (
                  <span
                    className="pointer-events-none absolute top-full hidden h-2 border-l border-dashed border-[#8b95a7] sm:block"
                    style={{ left: `${pos(bar.to)}%` }}
                    aria-hidden
                  />
                )}
              </span>
              <span className="flex items-baseline justify-end gap-1.5 text-right whitespace-nowrap tabular-nums">
                <span className={`${bar.value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"} ${strong ? "font-semibold" : ""} ${final ? "text-sm" : ""}`}>{amount}</span>
                {pct ? <span className="w-12 text-[11px] text-[#8b95a7]">{pct}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
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


/** t71: "n/s" marker with the reason on hover/focus. */
export function NotSignificant() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[#8b95a7]" title={notSignificantHint} aria-label={`${notSignificant}: ${notSignificantHint}`}>
      {notSignificant}
    </span>
  );
}

export function KpiTile({ metric, years }: { metric: Metric; years: SabiYear[] }) {
  const lastIndex = metric.values.findLastIndex((value, index) => value !== null || Boolean(metric.ns?.[index]));
  const lastNs = lastIndex >= 0 && Boolean(metric.ns?.[lastIndex]);
  const value = lastIndex >= 0 && !lastNs ? metric.values[lastIndex]! : null;
  const change = lastNs ? null : yearOverYear(metric.values);
  // t71: a % change over a tiny base (e.g. a first, almost empty year) is shown as n/s instead of +147.989 %.
  const relative = metric.unit === "eur" || metric.unit === "keur" || metric.unit === "people";
  const changeNs = change !== null && relative && !isComparableBase(change.previous, change.previous + change.delta);
  const good = change && !changeNs && metric.better !== "none" && change.delta !== 0 ? (change.delta > 0) === (metric.better === "up") : null;
  const chip = good === null ? "bg-[#eef0f4] text-[#3d4a63]" : good ? "bg-[#e6f4f2] text-[#0f5f59]" : "bg-[#fdecec] text-[#a12f2f]";

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[#e7eaee] bg-white p-3">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs leading-4 font-medium text-[#5c6b78]">{metric.label}</span>
        <FieldHint text={metric.hint} align="end" wide />
      </div>
      <span className={`mt-1 text-lg font-semibold tabular-nums ${value !== null && value < 0 ? "text-[#a12f2f]" : "text-[#1c2740]"}`}>
        {lastNs ? <NotSignificant /> : value === null ? "—" : formatValue(value, metric.unit)}
      </span>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#8b95a7]">
        {lastIndex >= 0 ? <span className="tabular-nums">{yearLabel(years[lastIndex]!)}</span> : null}
        {change ? (
          <span className={`rounded-full px-1.5 py-0.5 font-medium tabular-nums ${chip}`} title="Variación frente al ejercicio anterior con dato">
            {change.delta > 0 ? "▲" : change.delta < 0 ? "▼" : "="} {changeNs ? <NotSignificant /> : formatDelta(change.delta, change.previous, metric.unit)}
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-2">
        <Sparkline values={metric.values} color={teal} unit={metric.unit} />
      </div>
    </div>
  );
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
            <td className="px-3 py-1.5">{holderTypeLabel(row.type) ?? "—"}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{formatHoldingPercent(row.direct) ?? "—"}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{formatHoldingPercent(row.total) ?? "—"}</td>
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
  return <PeopleList people={[...people.values()]} />;
}

/** t80: first 6 people, the rest behind "Ver más (N)". */
const peopleShown = 6;
function PeopleList({ people }: { people: Array<{ name: string; roles: string[]; since: string | null; group: string | null }> }) {
  const [all, setAll] = useState(false);
  const shown = all ? people : people.slice(0, peopleShown);
  return (
    <div>
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {shown.map((person) => (
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
    {people.length > peopleShown ? (
      <button
        type="button"
        aria-expanded={all}
        onClick={() => setAll((value) => !value)}
        className="mt-3 rounded-lg px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
      >
        {all ? "Ver menos" : `Ver más (${people.length - peopleShown})`}
      </button>
    ) : null}
    </div>
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
  const raw = (value: number) => Math.min(100, Math.max(0, ((value - signal.min) / span) * 100));
  const ends = signal.zones.map((zone) => (zone.upTo === Infinity ? 100 : raw(zone.upTo)));
  const scaleZones = signal.zones.map((zone, index) => ({ level: zone.level, width: Math.max(ends[index]! - (index > 0 ? ends[index - 1]! : 0), 0) }));
  // t71: always bad on the left and good on the right. Metrics where lower is better (debt/EBITDA, days to collect)
  // are drawn mirrored so the red zone never ends up on the right.
  const mirrored = signal.zones[0]?.level === "good";
  const pos = (value: number) => (mirrored ? 100 - raw(value) : raw(value));
  const zones = mirrored ? [...scaleZones].reverse() : scaleZones;

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
      <div className="mt-1 flex justify-between text-[10px] text-[#8b95a7]" aria-hidden>
        <span>Peor</span>
        <span>Mejor</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#3d4a63]">{signal.reading}</p>
    </section>
  );
}

/** t77: shareholders next to the donut: top stakes plus one grouped "sin %" line, sized to the chart; "Ver más (N)" for the rest. */
export function ShareholderTable({ rows }: { rows: SabiHolding[] }) {
  const [all, setAll] = useState(false);
  const top = topShareholders(rows);
  const visible = all ? [...top.known, ...top.unknown] : top.shown;
  return (
    <div className="flex min-w-0 flex-col">
      <table className="w-full min-w-0 text-left text-sm">
        <caption className="sr-only">Accionistas y su participación</caption>
        <thead className="text-xs text-[#5c6b78]">
          <tr className="border-b border-[#eef0f4]">
            <th scope="col" className="py-2 pr-3 font-semibold">Accionista</th>
            <th scope="col" className="py-2 text-right font-semibold">Participación</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => {
            const type = holderTypeLabel(row.type);
            const share = formatHoldingPercent(row.direct) ?? formatHoldingPercent(row.total);
            return (
              <tr key={`${row.name}-${index}`} className="border-b border-[#eef0f4] last:border-0">
                <td className="min-w-0 py-2 pr-3">
                  <span className="block truncate font-medium text-[#1c2740]" title={row.name}>{row.name}</span>
                  {type || row.country ? <span className="block text-xs text-[#5c6b78]">{[type, row.country].filter(Boolean).join(" · ")}</span> : null}
                </td>
                <td className="py-2 text-right align-top font-semibold whitespace-nowrap text-[#0f5f59] tabular-nums">{share ?? "Sin dato"}</td>
              </tr>
            );
          })}
          {!all && top.unknown.length > 0 ? (
            <tr>
              <td className="py-2 pr-3">
                <span className="block font-medium text-[#1c2740]">
                  {top.unknown.length === 1 ? "1 accionista más" : `${top.unknown.length} accionistas más`}
                </span>
                <span className="block text-xs text-[#5c6b78]">Sin porcentaje publicado en el registro</span>
              </td>
              <td className="py-2 text-right align-top text-xs font-semibold whitespace-nowrap text-[#5c6b78]">Sin dato</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {top.hidden > 0 ? (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll((open) => !open)}
          className="mt-2 self-start rounded-lg px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
        >
          {all ? "Ver menos" : `Ver más (${top.hidden})`}
        </button>
      ) : null}
    </div>
  );
}
