import type { HeadcountRangeId } from "./company-profile";

/**
 * Múltiplos orientativos de EBITDA por sector para pymes en España.
 * NO son una valoración: sirven solo para dar al vendedor una referencia
 * rápida. Ajusta los valores aquí; el resto de la plataforma los lee de este
 * archivo. Si más adelante se usa una API de valoración, basta con
 * implementar `PriceEstimator` y sustituir `estimatePriceRange`.
 */
export const sectorMultiples = {
  hosteleria: { label: "hostelería", low: 2, high: 3.5 },
  comercio: { label: "comercio", low: 2.5, high: 4 },
  servicios_profesionales: { label: "servicios profesionales", low: 3, high: 5 },
  tecnologia: { label: "tecnología y software", low: 4, high: 7 },
  salud: { label: "salud", low: 4, high: 6 },
  industria: { label: "industria", low: 3.5, high: 5.5 },
  alimentacion: { label: "alimentación", low: 3, high: 5 },
  construccion: { label: "construcción", low: 2.5, high: 4 },
  transporte: { label: "transporte y logística", low: 3, high: 4.5 },
  turismo: { label: "turismo y ocio", low: 2.5, high: 4 },
  servicios: { label: "servicios", low: 3, high: 4.5 },
} as const satisfies Record<string, { label: string; low: number; high: number }>;

export type ValuationSector = keyof typeof sectorMultiples;

/** Ajuste del múltiplo (en veces EBITDA) según el tamaño de la plantilla. */
const headcountAdjustment: Record<HeadcountRangeId, number> = {
  band_1_5: -0.5,
  band_6_10: -0.25,
  band_11_20: 0,
  band_21_50: 0.25,
  band_over_50: 0.5,
};

/** Ajuste según el crecimiento de ventas del último año cerrado. */
const growthAdjustment = { strongGrowth: 0.1, decline: -0.05, up: 0.5, down: -0.5 };

/**
 * t94: EBITDA trendline. Least-squares slope over the last (up to) 3 consecutive closed years,
 * divided by the absolute mean EBITDA of those years, so it reads as "% change per year".
 */
const ebitdaTrendSteps = [
  { atLeast: 0.1, shift: 0.5 },
  { atLeast: 0.05, shift: 0.25 },
] as const;
const ebitdaTrendCap = 1;
/** Sales and EBITDA trend together never move the multiple more than this. */
const trendShiftCap = 0.75;

export type YearAmount = { year: number; cents: number };

/** Newest-to-oldest weights for the orientative price range. */
export const ebitdaRangeWeights = [0.5, 0.3, 0.2] as const;

/**
 * Weighted average of the last 1–3 available years of EBITDA (50/30/20 newest to oldest).
 * Years with missing or non-positive EBITDA are skipped; remaining weights are renormalized.
 */
export function weightedEbitdaCents(rows: readonly YearAmount[]): { cents: number; years: number[] } | null {
  const take = rows
    .filter((row) => Number.isInteger(row.year) && Number.isFinite(row.cents) && row.cents > 0)
    .sort((a, b) => b.year - a.year)
    .slice(0, ebitdaRangeWeights.length);
  if (take.length === 0) return null;
  const weights = ebitdaRangeWeights.slice(0, take.length);
  const sumW = weights.reduce((total, weight) => total + weight, 0);
  const cents = Math.round(take.reduce((sum, row, index) => sum + row.cents * weights[index], 0) / sumW);
  return { cents, years: take.map((row) => row.year) };
}

/** Relative EBITDA trendline (slope ÷ |mean|) of the last 3 consecutive years (2 minimum); null when not computable. */
export function ebitdaTrend(rows: readonly YearAmount[]): number | null {
  const sorted = rows.filter((row) => Number.isInteger(row.year) && Number.isFinite(row.cents)).sort((a, b) => b.year - a.year);
  const run: YearAmount[] = [];
  for (const row of sorted) {
    if (run.length === 3) break;
    if (run.length > 0 && run[run.length - 1].year - row.year !== 1) break;
    run.push(row);
  }
  if (run.length < 2) return null;
  const n = run.length;
  const meanX = run.reduce((sum, row) => sum + row.year, 0) / n;
  const meanY = run.reduce((sum, row) => sum + row.cents, 0) / n;
  if (Math.abs(meanY) < 1_000_00) return null;
  let num = 0;
  let den = 0;
  for (const row of run) {
    num += (row.year - meanX) * (row.cents - meanY);
    den += (row.year - meanX) ** 2;
  }
  const relative = num / den / Math.abs(meanY);
  return Math.max(-ebitdaTrendCap, Math.min(ebitdaTrendCap, relative));
}

function ebitdaTrendShift(trend: number): number {
  for (const step of ebitdaTrendSteps) {
    if (trend >= step.atLeast) return step.shift;
    if (trend <= -step.atLeast) return -step.shift;
  }
  return 0;
}

const minimumMultiple = 1;

export function valuationSectorFromCnae(code: string | null | undefined): ValuationSector {
  const division = Number.parseInt((code ?? "").slice(0, 2), 10);
  if (!Number.isFinite(division)) return "servicios";
  if (division === 56) return "hosteleria";
  if (division >= 45 && division <= 47) return "comercio";
  if (division >= 69 && division <= 75) return "servicios_profesionales";
  if (division >= 58 && division <= 63) return "tecnologia";
  if (division >= 86 && division <= 88) return "salud";
  if ((division >= 1 && division <= 3) || (division >= 10 && division <= 12)) return "alimentacion";
  if (division >= 5 && division <= 33) return "industria";
  if (division >= 41 && division <= 43) return "construccion";
  if (division >= 49 && division <= 53) return "transporte";
  if (division === 55 || division === 79 || (division >= 90 && division <= 93)) return "turismo";
  return "servicios";
}

export type PriceEstimateInput = {
  cnae: string | null;
  ebitdaCents: number | null;
  headcount?: HeadcountRangeId | null;
  /** Crecimiento de ventas del último año, en fracción (0.12 = +12 %). */
  revenueGrowth?: number | null;
  /** t94: tendencia del EBITDA (pendiente de mínimos cuadrados ÷ |media|, últimos 3 cierres); ver ebitdaTrend. */
  ebitdaTrend?: number | null;
};

export type PriceEstimate = {
  /** S32: the EBITDA the multiples were applied to (weighted closed years, or the adjusted EBITDA). */
  ebitdaCents: number;
  lowCents: number;
  highCents: number;
  sector: ValuationSector;
  sectorLabel: string;
  /** Múltiplos típicos del sector, antes de ajustar por tamaño o crecimiento. */
  sectorLow: number;
  sectorHigh: number;
  multipleLow: number;
  multipleHigh: number;
  adjustments: string[];
};

export type PriceEstimator = (input: PriceEstimateInput) => PriceEstimate | null;

export const estimatePriceRange: PriceEstimator = ({ cnae, ebitdaCents, headcount, revenueGrowth, ebitdaTrend: trend }) => {
  if (ebitdaCents === null || !Number.isFinite(ebitdaCents) || ebitdaCents <= 0) return null;
  const sector = valuationSectorFromCnae(cnae);
  const base = sectorMultiples[sector];
  let shift = 0;
  const adjustments: string[] = [];

  if (headcount) {
    const size = headcountAdjustment[headcount];
    if (size !== 0) {
      shift += size;
      adjustments.push(size > 0 ? "tamaño de la plantilla (+)" : "tamaño reducido (−)");
    }
  }
  let trendShift = 0;
  if (typeof revenueGrowth === "number" && Number.isFinite(revenueGrowth)) {
    if (revenueGrowth >= growthAdjustment.strongGrowth) {
      trendShift += growthAdjustment.up;
      adjustments.push("ventas en crecimiento (+)");
    } else if (revenueGrowth <= growthAdjustment.decline) {
      trendShift += growthAdjustment.down;
      adjustments.push("ventas en descenso (−)");
    }
  }

  if (typeof trend === "number" && Number.isFinite(trend)) {
    const ebitdaShift = ebitdaTrendShift(trend);
    if (ebitdaShift !== 0) {
      trendShift += ebitdaShift;
      adjustments.push(ebitdaShift > 0 ? "tendencia del EBITDA al alza (+)" : "tendencia del EBITDA a la baja (−)");
    }
  }
  shift += Math.max(-trendShiftCap, Math.min(trendShiftCap, trendShift));

  const multipleLow = Math.max(minimumMultiple, base.low + shift);
  const multipleHigh = Math.max(multipleLow + 0.5, base.high + shift);
  const roundTo = 1_000_00;
  return {
    ebitdaCents,
    lowCents: Math.round((ebitdaCents * multipleLow) / roundTo) * roundTo,
    highCents: Math.round((ebitdaCents * multipleHigh) / roundTo) * roundTo,
    sector,
    sectorLabel: base.label,
    sectorLow: base.low,
    sectorHigh: base.high,
    multipleLow,
    multipleHigh,
    adjustments,
  };
};

export type PriceStanding = "below" | "within" | "above";

export function priceStanding(askingCents: number, estimate: Pick<PriceEstimate, "lowCents" | "highCents">): PriceStanding {
  if (askingCents < estimate.lowCents) return "below";
  if (askingCents > estimate.highCents) return "above";
  return "within";
}

export function formatMultiple(value: number): string {
  return `${String(Math.round(value * 100) / 100).replace(".", ",")}x`;
}

/**
 * t93: the price bar. Its ends sit at half the low estimate and 1.5x the high one; the estimated range always fills
 * the green middle (35 %–65 % of the bar) so the colours never move. Returns where a price falls, 0..1, clamped.
 */
export const priceBarZone = { low: 0.35, high: 0.65 } as const;

export function priceBarEnds(estimate: Pick<PriceEstimate, "lowCents" | "highCents">): { minCents: number; maxCents: number } {
  return { minCents: Math.round(estimate.lowCents * 0.5), maxCents: Math.round(estimate.highCents * 1.5) };
}

export function priceBarPosition(cents: number, estimate: Pick<PriceEstimate, "lowCents" | "highCents">): number {
  const { minCents, maxCents } = priceBarEnds(estimate);
  const { lowCents, highCents } = estimate;
  const share = (value: number, from: number, to: number) => (to > from ? Math.min(1, Math.max(0, (value - from) / (to - from))) : 0.5);
  if (cents <= lowCents) return priceBarZone.low * share(cents, minCents, lowCents);
  if (cents <= highCents) return priceBarZone.low + (priceBarZone.high - priceBarZone.low) * share(cents, lowCents, highCents);
  return priceBarZone.high + (1 - priceBarZone.high) * share(cents, highCents, maxCents);
}

/** Inverse of `priceBarPosition`: a 0..1 bar share (clamped) back to cents. */
export function priceFromBarPosition(t: number, estimate: Pick<PriceEstimate, "lowCents" | "highCents">): number {
  const clamped = Math.min(1, Math.max(0, t));
  const { minCents, maxCents } = priceBarEnds(estimate);
  const { lowCents, highCents } = estimate;
  const lerp = (from: number, to: number, share: number) => Math.round(from + (to - from) * share);
  if (clamped <= priceBarZone.low) {
    const span = priceBarZone.low;
    return lerp(minCents, lowCents, span > 0 ? clamped / span : 0);
  }
  if (clamped <= priceBarZone.high) {
    const span = priceBarZone.high - priceBarZone.low;
    return lerp(lowCents, highCents, span > 0 ? (clamped - priceBarZone.low) / span : 0.5);
  }
  const span = 1 - priceBarZone.high;
  return lerp(highCents, maxCents, span > 0 ? (clamped - priceBarZone.high) / span : 1);
}
