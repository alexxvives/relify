"use client";

import { useEffect, useState } from "react";
import { FieldHint } from "@/components/field-hint";
import { ShareDonut } from "@/components/share-donut";
import { incomeLabels } from "@/lib/company-copy";
import { formatCompactEur } from "@/lib/money";
import { sellerCopy } from "@/lib/seller-copy";
import type { SellerCostSlice, SellerMix, SellerYearPoint } from "@/server/getSellerOverview";

const costColor: Record<string, string> = {
  [incomeLabels.supplies]: "#e07a3d",
  [incomeLabels.staffCosts]: "#465ab4",
  [incomeLabels.otherOperatingCosts]: "#7c5cbf",
  [incomeLabels.amortization]: "#0e8a78",
};

export type ChartYearPoint = SellerYearPoint & {
  salesLabel: string;
  ebitdaLabel: string | null;
};

export type ChartCostSlice = SellerCostSlice & {
  amountLabel: string;
};

const mixRowOrder: SellerMix["kind"][] = ["client", "product", "capital"];

export type ChartCostYear = {
  year: number;
  slices: ChartCostSlice[];
};

export function FinanceCharts({
  points,
  mixes,
  costYears,
  cards = true,
}: {
  points: ChartYearPoint[];
  mixes: SellerMix[];
  costYears: ChartCostYear[];
  cards?: boolean;
}) {
  const progress = useGrow();
  const row = mixRowOrder.flatMap((kind) => {
    const mix = mixes.find((item) => item.kind === kind);
    return mix ? [mix] : [];
  });
  const split = costYears.length > 0;

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className={split ? "grid items-start gap-6 lg:grid-cols-2" : undefined}>
        <SalesBars points={points} progress={progress} cards={cards} />
        {split ? <CostBars years={costYears} cards={cards} /> : null}
      </div>
      {row.length > 0 ? (
        <div className={mixRowClass(row.length)}>
          {row.map((mix) => (
            <ShareDonut key={mix.kind} title={mix.title} slices={mix.slices} palette={mix.kind} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mixRowClass(count: number): string {
  if (count >= 3) {
    return "grid items-stretch gap-3 md:grid-cols-3";
  }

  if (count === 2) {
    return "grid items-stretch gap-3 md:grid-cols-2";
  }

  return "grid items-stretch gap-3";
}

function useGrow(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 700;

    const step = (now: number) => {
      const next = Math.min(1, (now - start) / duration);
      setProgress(1 - (1 - next) ** 3);
      if (next < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  return progress;
}

function SalesBars({ points, progress, cards }: { points: ChartYearPoint[]; progress: number; cards: boolean }) {
  const hasEbitda = points.some((point) => point.ebitdaCents !== null);
  const width = 720;
  const height = 320;
  const padLeft = 78;
  const padRight = 16;
  const frameTop = 4;
  const legendBand = 36;
  const padTop = frameTop + legendBand + 8;
  const padBottom = 32;
  const plotHeight = height - padTop - padBottom;
  const values = points.flatMap((point) => {
    const next: number[] = [];
    if (point.salesCents !== null) {
      next.push(point.salesCents);
    }
    if (point.ebitdaCents !== null) {
      next.push(point.ebitdaCents);
    }
    return next;
  });
  const ticks = axisTicks(Math.min(0, ...values), Math.max(...values, 1));
  const scaleMin = Math.min(...ticks);
  const scaleMax = Math.max(...ticks);
  const span = scaleMax - scaleMin || 1;
  const yOf = (cents: number) => padTop + ((scaleMax - cents) / span) * plotHeight;
  const zero = yOf(0);
  const groupWidth = (width - padLeft - padRight) / Math.max(points.length, 1);
  const barWidth = hasEbitda ? 28 : 44;

  const legend = [
    { label: sellerCopy.financeSales, color: "#465ab4" },
    ...(hasEbitda ? [{ label: sellerCopy.financeEbitda, color: "#17663a" }] : []),
    ...(points.some((point) => point.forecast) ? [{ label: `* ${sellerCopy.financeForecast}`, color: null }] : []),
  ];

  return (
    <div>
      <div className="flex h-11 items-center">
        <h3 className="text-sm font-semibold text-[#1c2740]">
          {hasEbitda ? sellerCopy.financeBarsTitle : sellerCopy.financeSales}
        </h3>
      </div>
      <div className="relative mt-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-hidden
      >
        <rect x={padLeft} y={frameTop} width={width - padLeft - padRight} height={legendBand + plotHeight} rx="16" fill="#f7f8fc" />
        {ticks.map((tick) => {
          const y = yOf(tick);
          const axis = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke={axis ? "#c5cdd8" : "#e6e9f0"}
                strokeWidth={axis ? 1.5 : 1}
              />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#667085" fontSize="12">
                {formatCompactEur(tick)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const center = padLeft + groupWidth * index + groupWidth / 2;
          const salesX = hasEbitda ? center - barWidth - 6 : center - barWidth / 2;
          const ebitdaX = center + 6;
          const bars: PlotBar[] = [];
          if (point.salesCents !== null) {
            const box = barBox(zero, point.salesCents, yOf, progress);
            bars.push({
              x: salesX,
              width: barWidth,
              top: box.top,
              height: box.height,
              preferredY: labelY(point.salesCents, box, padTop),
              value: formatCompactEur(point.salesCents),
              fill: "#465ab4",
              muted: point.forecast,
              color: "#465ab4",
            });
          }
          if (point.ebitdaCents !== null) {
            const box = barBox(zero, point.ebitdaCents, yOf, progress);
            bars.push({
              x: ebitdaX,
              width: barWidth,
              top: box.top,
              height: box.height,
              preferredY: labelY(point.ebitdaCents, box, padTop),
              value: formatCompactEur(point.ebitdaCents),
              fill: "#17663a",
              muted: point.forecast,
              color: "#17663a",
            });
          }
          const labels = placeLabels(bars, padTop + 14);
          return (
            <g key={point.year}>
              {bars.map((bar) => (
                <Bar key={`${bar.value}-${bar.x}`} x={bar.x} box={{ top: bar.top, height: bar.height }} width={bar.width} color={bar.color} muted={bar.muted} />
              ))}
              {bars.map((bar, barIndex) => {
                const spot = labels[barIndex];
                return (
                <BarValue
                  key={`${bar.value}-label`}
                  x={bar.x + bar.width / 2 + (spot?.dx ?? 0)}
                  y={spot?.y ?? bar.preferredY}
                  muted={bar.muted}
                  value={bar.value}
                  fill={bar.fill}
                />
                );
              })}
              <text x={center} y={height - 12} textAnchor="middle" fill="#3d4a63" fontSize="13" fontWeight="600">
                {point.forecast ? `${point.year}*` : point.year}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartKey items={legend} />
      </div>
      {cards ? (
      <ul className="mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}>
        {points.map((point) => (
          <li key={point.year} className="rounded-xl bg-[#f4f7ff] px-3 py-2 text-center">
            <p className="text-xs text-[#667085]">
              {point.year}
              {point.forecast ? ` · ${sellerCopy.financeForecast}` : ""}
            </p>
            <p className="mt-1 flex items-baseline justify-center gap-3">
              <span className="text-sm font-semibold whitespace-nowrap text-[#465ab4] tabular-nums">{point.salesLabel}</span>
              {point.ebitdaLabel === null ? null : (
                <span className="text-sm font-semibold whitespace-nowrap text-[#17663a] tabular-nums">{point.ebitdaLabel}</span>
              )}
            </p>
          </li>
        ))}
      </ul>
      ) : null}
    </div>
  );
}

export function GroupedYearBars({
  title,
  hint,
  years,
  series,
  paired = false,
  showCards = false,
  axis = "left",
}: {
  title: string;
  hint?: string;
  years: { year: number; forecast: boolean }[];
  series: { label: string; color: string; values: Array<number | null> }[];
  paired?: boolean;
  showCards?: boolean;
  axis?: "left" | "right";
}) {
  const progress = useGrow();
  const drawn = series.filter((item) => item.values.some((value) => value !== null));

  if (years.length === 0 || drawn.length === 0) {
    return null;
  }

  const width = 720;
  const height = 320;
  const padLeft = axis === "right" ? 16 : 78;
  const padRight = axis === "right" ? 78 : 16;
  const frameTop = 4;
  const legendBand = drawn.length > 3 ? 52 : 36;
  const padTop = frameTop + legendBand + 8;
  const padBottom = 32;
  const plotHeight = height - padTop - padBottom;
  const values = drawn.flatMap((item) => item.values.flatMap((value) => (value === null ? [] : [value])));
  const ticks = axisTicks(Math.min(0, ...values), Math.max(...values, 1));
  const scaleMin = Math.min(...ticks);
  const scaleMax = Math.max(...ticks);
  const span = scaleMax - scaleMin || 1;
  const yOf = (cents: number) => padTop + ((scaleMax - cents) / span) * plotHeight;
  const zero = yOf(0);
  const groupWidth = (width - padLeft - padRight) / Math.max(years.length, 1);
  const barWidth = Math.min(28, Math.max(10, (groupWidth - 16) / drawn.length - 4));
  const cluster = drawn.length * barWidth + (drawn.length - 1) * 4;

  return (
    <div className={paired ? undefined : "mt-6"}>
      {paired ? (
        <div className="flex h-11 items-center">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#1c2740]">
            {title}
            {hint ? <FieldHint text={hint} /> : null}
          </h3>
        </div>
      ) : (
        <h3 className="text-sm font-semibold text-[#1c2740]">{title}</h3>
      )}
      <div className="relative mt-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-hidden
      >
        <rect x={padLeft} y={frameTop} width={width - padLeft - padRight} height={legendBand + plotHeight} rx="16" fill="#f7f8fc" />
        {ticks.map((tick) => {
          const y = yOf(tick);
          const baseline = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke={baseline ? "#c5cdd8" : "#e6e9f0"}
                strokeWidth={baseline ? 1.5 : 1}
              />
              <text
                x={axis === "right" ? width - padRight + 10 : padLeft - 10}
                y={y + 4}
                textAnchor={axis === "right" ? "start" : "end"}
                fill="#667085"
                fontSize="12"
              >
                {formatCompactEur(tick)}
              </text>
            </g>
          );
        })}
        {years.map((year, index) => {
          const center = padLeft + groupWidth * index + groupWidth / 2;
          const origin = center - cluster / 2;
          const bars = drawn.flatMap((item, seriesIndex) => {
            const value = item.values[index] ?? null;
            if (value === null) {
              return [];
            }
            const box = barBox(zero, value, yOf, progress);
            const x = origin + seriesIndex * (barWidth + 4);
            return [
              {
                x,
                width: barWidth,
                top: box.top,
                height: box.height,
                preferredY: labelY(value, box, padTop),
                value: formatCompactEur(value),
                fill: item.color,
                muted: year.forecast,
                color: item.color,
              },
            ];
          });
          const labels = placeLabels(bars, padTop + 14);
          return (
            <g key={year.year}>
              {bars.map((bar) => (
                <Bar key={`${bar.fill}-${bar.x}`} x={bar.x} box={{ top: bar.top, height: bar.height }} width={bar.width} color={bar.color} muted={bar.muted} />
              ))}
              {bars.map((bar, barIndex) => {
                const spot = labels[barIndex];
                return (
                <BarValue
                  key={`${bar.fill}-label`}
                  x={bar.x + bar.width / 2 + (spot?.dx ?? 0)}
                  y={spot?.y ?? bar.preferredY}
                  muted={bar.muted}
                  value={bar.value}
                  fill={bar.fill}
                />
                );
              })}
              <text x={center} y={height - 12} textAnchor="middle" fill="#3d4a63" fontSize="13" fontWeight="600">
                {year.forecast ? `${year.year}*` : year.year}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartKey items={drawn.map((item) => ({ label: item.label, color: item.color }))} />
      </div>
      {showCards ? (
        <ul className="mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}>
          {years.map((year, index) => (
            <li key={year.year} className="rounded-xl bg-[#f4f7ff] px-3 py-2 text-center">
              <p className="text-xs text-[#667085]">
                {year.year}
                {year.forecast ? ` · ${sellerCopy.financeForecast}` : ""}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
                {drawn.map((item) => {
                  const value = item.values[index] ?? null;
                  if (value === null) {
                    return null;
                  }
                  return (
                    <span key={item.label} className="text-sm font-semibold whitespace-nowrap tabular-nums" style={{ color: item.color }}>
                      {formatCompactEur(value)}
                    </span>
                  );
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ChartKey({ items }: { items: { label: string; color: string | null }[] }) {
  return (
    <ul className="pointer-events-none absolute top-2 right-[4%] left-[12%] flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] leading-4 text-[#667085]">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          {item.color ? <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} /> : null}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function axisTicks(min: number, max: number): number[] {
  const span = Math.max(max - min, 1);
  const rough = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const count = Math.max(1, Math.round((end - start) / step));
  const ticks: number[] = [];

  for (let index = 0; index <= count; index += 1) {
    ticks.push(start + step * index);
  }

  return ticks;
}

function labelY(cents: number, box: { top: number; height: number }, padTop: number): number {
  return cents < 0 ? box.top + box.height + 14 : Math.max(box.top - 8, padTop + 16);
}

type PlotBar = {
  x: number;
  width: number;
  top: number;
  height: number;
  preferredY: number;
  value: string;
  fill: string;
  muted: boolean;
  color: string;
};

function textWidth(value: string): number {
  return Math.max(36, value.length * 6.6);
}

type PlacedLabel = { y: number; dx: number };

function labelBox(bar: PlotBar, y: number, dx: number) {
  const width = textWidth(bar.value);
  const center = bar.x + bar.width / 2 + dx;
  return { left: center - width / 2, right: center + width / 2, top: y - 14, bottom: y + 4 };
}

function boxesOverlap(
  left: { left: number; right: number; top: number; bottom: number },
  right: { left: number; right: number; top: number; bottom: number },
): boolean {
  return left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
}

function placeLabels(bars: PlotBar[], ceiling: number): PlacedLabel[] {
  const order = bars
    .map((_, index) => index)
    .sort((left, right) => (bars[left]?.preferredY ?? 0) - (bars[right]?.preferredY ?? 0));
  const placed: PlacedLabel[] = bars.map((bar) => ({ y: bar.preferredY, dx: 0 }));

  for (const index of order) {
    const bar = bars[index];
    if (!bar) {
      continue;
    }

    let y = bar.preferredY;
    let dx = 0;
    const earlier = order.slice(0, order.indexOf(index));

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const box = labelBox(bar, y, dx);
      const hitsBar = bars.some((other, otherIndex) => {
        if (otherIndex === index || other.height <= 0) {
          return false;
        }

        return box.left < other.x + other.width && box.right > other.x && box.top < other.top + other.height && box.bottom > other.top;
      });
      const hitsLabel = earlier.some((otherIndex) => {
        const other = bars[otherIndex];
        const spot = placed[otherIndex];
        return other !== undefined && spot !== undefined && boxesOverlap(box, labelBox(other, spot.y, spot.dx));
      });

      if (!hitsBar && !hitsLabel) {
        break;
      }

      if (y - 16 >= ceiling) {
        y -= 16;
      } else {
        const step = 20 * (Math.floor(attempt / 2) + 1);
        const neighbor = bars[index === 0 ? 1 : index - 1];
        dx = neighbor && bar.x > neighbor.x ? step : -step;
      }
    }

    placed[index] = { y: Math.max(y, ceiling), dx };
  }

  return placed;
}

function BarValue({ x, y, value, muted, fill = "#1c2740" }: { x: number; y: number; value: string; muted: boolean; fill?: string }) {
  const width = textWidth(value);
  return (
    <g>
      <rect x={x - width / 2} y={y - 12} width={width} height={15} rx="4" fill="#f7f8fc" />
      <text x={x} y={y} textAnchor="middle" fill={muted ? "#667085" : fill} fontSize="11" fontWeight="600">
        {value}
      </text>
    </g>
  );
}

function barBox(zero: number, cents: number, yOf: (cents: number) => number, progress: number) {
  const y = yOf(cents);
  const fullHeight = Math.max(Math.abs(zero - y), cents === 0 ? 0 : 4);
  const height = fullHeight * progress;
  const top = y < zero ? zero - height : zero;
  return { top, height };
}

function Bar({
  x,
  box,
  width,
  color,
  muted,
}: {
  x: number;
  box: { top: number; height: number };
  width: number;
  color: string;
  muted: boolean;
}) {
  return <rect x={x} y={box.top} width={width} height={Math.max(box.height, 0)} rx="8" fill={color} opacity={muted ? 0.4 : 1} />;
}

function CostBars({ years, cards }: { years: ChartCostYear[]; cards: boolean }) {
  const ordered = [...years].sort((left, right) => left.year - right.year);
  const labels = ordered.flatMap((year) => year.slices.map((slice) => slice.label)).filter((label, index, all) => all.indexOf(label) === index);
  const series = labels.map((label) => ({
    label,
    color: costColor[label] ?? "#465ab4",
    values: ordered.map((year) => year.slices.find((slice) => slice.label === label)?.cents ?? null),
  }));

  return (
    <GroupedYearBars
      title={sellerCopy.financeCostTitle}
      hint={sellerCopy.financeCostHint}
      years={ordered.map((year) => ({ year: year.year, forecast: false }))}
      series={series}
      paired
      showCards={cards}
      axis="right"
    />
  );
}
