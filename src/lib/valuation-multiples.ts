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

/** t93: same idea for the EBITDA trend (last two closed years), with half the weight of sales. */
const ebitdaGrowthAdjustment = { strongGrowth: 0.1, decline: -0.05, up: 0.25, down: -0.25 };

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
  /** t93: crecimiento del EBITDA del último año, en fracción; null si no hay dos cierres comparables. */
  ebitdaGrowth?: number | null;
};

export type PriceEstimate = {
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

export const estimatePriceRange: PriceEstimator = ({ cnae, ebitdaCents, headcount, revenueGrowth, ebitdaGrowth }) => {
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
  if (typeof revenueGrowth === "number" && Number.isFinite(revenueGrowth)) {
    if (revenueGrowth >= growthAdjustment.strongGrowth) {
      shift += growthAdjustment.up;
      adjustments.push("ventas en crecimiento (+)");
    } else if (revenueGrowth <= growthAdjustment.decline) {
      shift += growthAdjustment.down;
      adjustments.push("ventas en descenso (−)");
    }
  }

  if (typeof ebitdaGrowth === "number" && Number.isFinite(ebitdaGrowth)) {
    if (ebitdaGrowth >= ebitdaGrowthAdjustment.strongGrowth) {
      shift += ebitdaGrowthAdjustment.up;
      adjustments.push("EBITDA en crecimiento (+)");
    } else if (ebitdaGrowth <= ebitdaGrowthAdjustment.decline) {
      shift += ebitdaGrowthAdjustment.down;
      adjustments.push("EBITDA en descenso (−)");
    }
  }

  const multipleLow = Math.max(minimumMultiple, base.low + shift);
  const multipleHigh = Math.max(multipleLow + 0.5, base.high + shift);
  const roundTo = 1_000_00;
  return {
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
