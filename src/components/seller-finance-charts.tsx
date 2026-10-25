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
}: {
  points: ChartYearPoint[];
  mixes: SellerMix[];
  costYears: ChartCostYear[];
}) {
  const progress = useGrow();
  const row = mixRowOrder.flatMap((kind) => {
    const mix = mixes.find((item) => item.kind === kind);
    return mix ? [mix] : [];
  });
  const split = costYears.length > 0;

  return (
    <div className="@container mt-4 flex flex-col gap-6">
      <div className={split ? "grid items-start gap-6 @4xl:grid-cols-2" : "max-w-4xl"}>
        <SalesBars points={points} progress={progress} />
        {split ? <CostBars years={costYears} /> : null}
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

const placeholderYears = [2022, 2023, 2024, 2025] as const;
const placeholderSales = [0.35, 0.55, 0.48, 0.72] as const;
const placeholderEbitda = [0.18, 0.28, 0.22, 0.34] as const;
const placeholderCosts = [
  [0.42, 0.28, 0.18, 0.12],
  [0.38, 0.32, 0.2, 0.1],
  [0.4, 0.3, 0.16, 0.14],
  [0.36, 0.34, 0.18, 0.12],
] as const;
const placeholderCostColors = ["#d6dbe4", "#c5ccd8", "#b4bdc9", "#a3adb9"] as const;
const placeholderMixes = [
  { title: sellerCopy.mixClient, tones: ["#d6dbe4", "#c5ccd8", "#b4bdc9", "#e8ecf2"] },
  { title: sellerCopy.mixProduct, tones: ["#d6dbe4", "#c5ccd8", "#b4bdc9", "#e8ecf2"] },
  { title: sellerCopy.mixCapital, tones: ["#d6dbe4", "#c5ccd8", "#b4bdc9", "#e8ecf2"] },
] as const;

export function FinanceChartsPlaceholder() {
  return (
    <div className="@container mt-4 flex flex-col gap-6" aria-hidden>
      <div className="grid items-start gap-6 @4xl:grid-cols-2">
        <PlaceholderBars
          title={sellerCopy.financeBarsTitle}
          series={[
            { values: placeholderSales, color: "#c5ccd8" },
            { values: placeholderEbitda, color: "#a8b2c0" },
          ]}
        />
        <PlaceholderStackedBars title={sellerCopy.financeCostTitle} />
      </div>
      <div className="grid items-stretch gap-3 md:grid-cols-3">
        {placeholderMixes.map((mix) => (
          <section key={mix.title} className="flex min-h-40 flex-col rounded-xl bg-[#f4f7ff] p-4">
            <h3 className="text-sm font-semibold text-[#b0b8c4]">{mix.title}</h3>
            <div className="mt-4 flex flex-1 items-center justify-center">
              <svg viewBox="0 0 42 42" className="h-auto w-full max-w-28" aria-hidden>
                <circle cx="21" cy="21" r="15.5" fill="none" stroke="#e8ecf2" strokeWidth="6" />
                <circle
                  cx="21"
                  cy="21"
                  r="15.5"
                  fill="none"
                  stroke={mix.tones[0]}
                  strokeWidth="6"
                  strokeDasharray="40 60"
                  strokeDashoffset="25"
                  transform="rotate(-90 21 21)"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.5"
                  fill="none"
                  stroke={mix.tones[1]}
                  strokeWidth="6"
                  strokeDasharray="28 72"
                  strokeDashoffset="-15"
                  transform="rotate(-90 21 21)"
                />
              </svg>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PlaceholderBars({
  title,
  series,
}: {
  title: string;
  series: { values: readonly number[]; color: string }[];
}) {
  const width = 720;
  const height = 220;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 28;
  const padBottom = 32;
  const plotHeight = height - padTop - padBottom;
  const groupWidth = (width - padLeft - padRight) / placeholderYears.length;
  const barWidth = 28;
  const gap = 8;

  return (
    <div>
      <div className="flex h-11 items-center">
        <h3 className="text-sm font-semibold text-[#b0b8c4]">{title}</h3>
      </div>
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" style={{ aspectRatio: `${width} / ${height}` }} aria-hidden>
          <rect x={padLeft} y={16} width={width - padLeft - padRight} height={padTop - 16 + plotHeight} rx="16" fill="#f3f5f8" />
          {[0.25, 0.5, 0.75, 1].map((tick) => {
            const y = padTop + (1 - tick) * plotHeight;
            return <line key={tick} x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#e6e9f0" strokeWidth={1} />;
          })}
          {placeholderYears.map((year, index) => {
            const center = padLeft + groupWidth * index + groupWidth / 2;
            const cluster = series.length * barWidth + (series.length - 1) * gap;
            const origin = center - cluster / 2;
            return (
              <g key={year}>
                {series.map((item, seriesIndex) => {
                  const value = item.values[index] ?? 0.3;
                  const barHeight = Math.max(8, value * plotHeight);
                  return (
                    <rect
                      key={`${year}-${seriesIndex}`}
                      x={origin + seriesIndex * (barWidth + gap)}
                      y={padTop + plotHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx="8"
                      fill={item.color}
                    />
                  );
                })}
                <text x={center} y={height - 12} textAnchor="middle" fill="#c5ccd8" fontSize="16" fontWeight="600">
                  {year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function PlaceholderStackedBars({ title }: { title: string }) {
  const width = 720;
  const height = 220;
  const padLeft = 16;
  const padRight = 48;
  const padTop = 28;
  const padBottom = 32;
  const plotHeight = height - padTop - padBottom;
  const groupWidth = (width - padLeft - padRight) / placeholderYears.length;
  const barWidth = 36;

  return (
    <div>
      <div className="flex h-11 items-center">
        <h3 className="text-sm font-semibold text-[#b0b8c4]">{title}</h3>
      </div>
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" style={{ aspectRatio: `${width} / ${height}` }} aria-hidden>
          <rect x={padLeft} y={16} width={width - padLeft - padRight} height={padTop - 16 + plotHeight} rx="16" fill="#f3f5f8" />
          {placeholderYears.map((year, index) => {
            const center = padLeft + groupWidth * index + groupWidth / 2;
            const x = center - barWidth / 2;
            let from = padTop + plotHeight;
            const slices = placeholderCosts[index] ?? placeholderCosts[0];
            return (
              <g key={year}>
                {slices.map((share, sliceIndex) => {
                  const barHeight = share * plotHeight * 0.85;
                  from -= barHeight;
                  return (
                    <rect
                      key={`${year}-${sliceIndex}`}
                      x={x}
                      y={from}
                      width={barWidth}
                      height={barHeight}
                      fill={placeholderCostColors[sliceIndex] ?? "#c5ccd8"}
                    />
                  );
                })}
                <text x={center} y={height - 12} textAnchor="middle" fill="#c5ccd8" fontSize="16" fontWeight="600">
                  {year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
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

  return "grid min-w-0 items-stretch gap-3";
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

function SalesBars({ points, progress }: { points: ChartYearPoint[]; progress: number }) {
  const hasEbitda = points.some((point) => point.ebitdaCents !== null);
  const [hover, setHover] = useState<string | null>(null);
  const frame = chartFrame(hasEbitda ? 2 : 1);
  const width = 720;
  const height = frame.height;
  const padLeft = 78;
  const padRight = 16;
  const frameTop = frame.frameTop;
  const padTop = frame.padTop;
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
  const barWidth = 32;
  const pairGap = hasEbitda ? 10 : 0;
  const groups = points.map((point, index) => {
    const center = padLeft + groupWidth * index + groupWidth / 2;
    const cluster = hasEbitda ? barWidth * 2 + pairGap : barWidth;
    const salesX = center - cluster / 2;
    const ebitdaX = salesX + barWidth + pairGap;
    const bars: PlotBar[] = [];
    if (point.salesCents !== null) {
      const box = barBox(zero, point.salesCents, yOf, progress);
      bars.push({
        x: salesX,
        width: barWidth,
        top: box.top,
        height: box.height,
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
        value: formatCompactEur(point.ebitdaCents),
        fill: "#17663a",
        muted: point.forecast,
        color: "#17663a",
      });
    }
    return { point, center, bars };
  });
  const flatBars = groups.flatMap((group) => group.bars);
  const resting = restingLabels(flatBars);

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
        <rect x={padLeft} y={frameTop} width={width - padLeft - padRight} height={padTop - frameTop + plotHeight} rx="16" fill="#f7f8fc" />
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
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#667085" fontSize="15">
                {formatCompactEur(tick)}
              </text>
            </g>
          );
        })}
        {groups.map((group, groupIndex) => {
          const offset = groups.slice(0, groupIndex).reduce((sum, item) => sum + item.bars.length, 0);
          return (
            <g key={group.point.year}>
              {group.bars.map((bar, barIndex) => {
                const key = `${group.point.year}-${barIndex}`;
                const show = hover === key || resting[offset + barIndex] === true;
                return (
                  <g key={key}>
                    <Bar
                      x={bar.x}
                      box={{ top: bar.top, height: bar.height }}
                      width={bar.width}
                      color={bar.color}
                      muted={bar.muted}
                      onHover={(active) => {
                        setHover(active ? key : null);
                      }}
                    />
                    {show ? (
                      <BarValue x={bar.x + bar.width / 2} y={bar.top - 4} muted={bar.muted} value={bar.value} fill={bar.fill} />
                    ) : null}
                  </g>
                );
              })}
              <text x={group.center} y={height - 12} textAnchor="middle" fill="#3d4a63" fontSize="16" fontWeight="600">
                {group.point.forecast ? `${group.point.year}*` : group.point.year}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartKey items={legend} />
      </div>
    </div>
  );
}

export function GroupedYearBars({
  title,
  hint,
  years,
  series,
  paired = false,
  axis = "left",
}: {
  title: string;
  hint?: string;
  years: { year: number; forecast: boolean }[];
  series: { label: string; color: string; values: Array<number | null> }[];
  paired?: boolean;
  axis?: "left" | "right";
}) {
  const progress = useGrow();
  const [hover, setHover] = useState<string | null>(null);
  const drawn = series.filter((item) => item.values.some((value) => value !== null));

  if (years.length === 0 || drawn.length === 0) {
    return null;
  }

  const frame = chartFrame(drawn.length);
  const width = 720;
  const height = frame.height;
  const padLeft = axis === "right" ? 16 : 78;
  const padRight = axis === "right" ? 78 : 16;
  const frameTop = frame.frameTop;
  const padTop = frame.padTop;
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
  const barWidth = 32;
  const openGap =
    drawn.length > 1 ? Math.max(4, Math.min(8, (groupWidth - 8 - drawn.length * barWidth) / (drawn.length - 1))) : 0;
  const seriesGap = drawn.slice(0, -1).map(() => openGap);
  const cluster = drawn.length * barWidth + seriesGap.reduce((sum, gap) => sum + gap, 0);
  const groups = years.map((year, index) => {
    const center = padLeft + groupWidth * index + groupWidth / 2;
    const origin = center - cluster / 2;
    const bars = drawn.flatMap((item, seriesIndex) => {
      const value = item.values[index] ?? null;
      if (value === null) {
        return [];
      }
      const box = barBox(zero, value, yOf, progress);
      const x = origin + seriesIndex * barWidth + seriesGap.slice(0, seriesIndex).reduce((sum, gap) => sum + gap, 0);
      return [
        {
          x,
          width: barWidth,
          top: box.top,
          height: box.height,
          value: formatCompactEur(value),
          fill: item.color,
          muted: year.forecast,
          color: item.color,
        },
      ];
    });
    return { year, center, bars };
  });
  const flatBars = groups.flatMap((group) => group.bars);
  const resting = restingLabels(flatBars);

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
        <rect x={padLeft} y={frameTop} width={width - padLeft - padRight} height={padTop - frameTop + plotHeight} rx="16" fill="#f7f8fc" />
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
                fontSize="15"
              >
                {formatCompactEur(tick)}
              </text>
            </g>
          );
        })}
        {groups.map((group, groupIndex) => {
          const offset = groups.slice(0, groupIndex).reduce((sum, item) => sum + item.bars.length, 0);
          return (
            <g key={group.year.year}>
              {group.bars.map((bar, barIndex) => {
                const key = `${group.year.year}-${barIndex}`;
                const show = hover === key || resting[offset + barIndex] === true;
                return (
                  <g key={key}>
                    <Bar
                      x={bar.x}
                      box={{ top: bar.top, height: bar.height }}
                      width={bar.width}
                      color={bar.color}
                      muted={bar.muted}
                      onHover={(active) => {
                        setHover(active ? key : null);
                      }}
                    />
                    {show ? (
                      <BarValue x={bar.x + bar.width / 2} y={bar.top - 4} muted={bar.muted} value={bar.value} fill={bar.fill} />
                    ) : null}
                  </g>
                );
              })}
              <text x={group.center} y={height - 12} textAnchor="middle" fill="#3d4a63" fontSize="16" fontWeight="600">
                {group.year.forecast ? `${group.year.year}*` : group.year.year}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartKey items={drawn.map((item) => ({ label: item.label, color: item.color }))} />
      </div>
    </div>
  );
}

function ChartKey({ items }: { items: { label: string; color: string | null }[] }) {
  return (
    <ul className="pointer-events-none absolute top-2 right-[4%] left-[12%] flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs leading-4 text-[#667085]">
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

type PlotBar = {
  x: number;
  width: number;
  top: number;
  height: number;
  value: string;
  fill: string;
  muted: boolean;
  color: string;
};

function textWidth(value: string): number {
  return Math.max(48, Math.ceil(value.length * 9));
}

function labelBoxAt(bar: PlotBar) {
  const width = textWidth(bar.value);
  const center = bar.x + bar.width / 2;
  const y = bar.top - 4;
  return { left: center - width / 2 - 3, right: center + width / 2 + 3, top: y - 14, bottom: y + 3 };
}

function restingLabels(bars: PlotBar[]): boolean[] {
  const placed: ReturnType<typeof labelBoxAt>[] = [];

  return bars.map((bar) => {
    const box = labelBoxAt(bar);
    const hits = placed.some((other) => other.left < box.right && other.right > box.left && other.top < box.bottom && other.bottom > box.top);

    if (!hits) {
      placed.push(box);
    }

    return !hits;
  });
}

function chartFrame(seriesCount: number) {
  const labelLane = 22;
  const frameTop = 4;
  const legendBand = seriesCount > 3 ? 52 : 36;
  return {
    frameTop,
    legendBand,
    padTop: frameTop + legendBand + labelLane,
    labelCeiling: frameTop + legendBand + 14,
    height: 292 + labelLane,
  };
}

function BarValue({ x, y, value, muted, fill = "#1c2740" }: { x: number; y: number; value: string; muted: boolean; fill?: string }) {
  const width = textWidth(value);
  return (
    <g>
      <rect x={x - width / 2} y={y - 12} width={width} height={15} rx="4" fill="#f7f8fc" />
      <text x={x} y={y} textAnchor="middle" fill={muted ? "#667085" : fill} fontSize="14" fontWeight="600">
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
  onHover,
}: {
  x: number;
  box: { top: number; height: number };
  width: number;
  color: string;
  muted: boolean;
  onHover?: (active: boolean) => void;
}) {
  return (
    <rect
      x={x}
      y={box.top}
      width={width}
      height={Math.max(box.height, 0)}
      rx="8"
      fill={color}
      opacity={muted ? 0.55 : 1}
      onMouseEnter={() => {
        onHover?.(true);
      }}
      onMouseLeave={() => {
        onHover?.(false);
      }}
    />
  );
}

function CostBars({ years }: { years: ChartCostYear[] }) {
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
      axis="right"
    />
  );
}
