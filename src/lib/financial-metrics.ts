import { ebitdaMarginBasisPoints } from "./company-profile";
import { marginPercent, type SabiYear } from "./sabi/insights";

/** How many closed years the ficha, Tus cifras, and marketplace share (all available, capped). */
export const fichaClosedYearCount = 4;

export function latestClosedYears<T extends { year: number }>(years: T[], cap = fichaClosedYearCount): T[] {
  return [...years].sort((left, right) => left.year - right.year).slice(-cap);
}

/**
 * Cash runway from the real treasury change of the last closed year.
 * consumo mensual = (tesorería inicio − tesorería fin) / 12; runway = caja actual / consumo.
 * If tesorería rose, the company generated cash.
 */
export type CashRunway =
  | { kind: "months"; months: number; cashCents: number; startCents: number; endCents: number; monthlyBurnCents: number }
  | { kind: "generates"; cashCents: number; startCents: number; endCents: number };

export function cashRunway(last: SabiYear, previous: SabiYear | null): CashRunway | null {
  if (previous === null || last.cashCents === null || previous.cashCents === null) {
    return null;
  }
  const startCents = previous.cashCents;
  const endCents = last.cashCents;
  const consumed = startCents - endCents;
  if (consumed <= 0) {
    return { kind: "generates", cashCents: endCents, startCents, endCents };
  }
  const monthlyBurnCents = consumed / 12;
  if (monthlyBurnCents <= 0) {
    return { kind: "generates", cashCents: endCents, startCents, endCents };
  }
  return {
    kind: "months",
    months: endCents / monthlyBurnCents,
    cashCents: endCents,
    startCents,
    endCents,
    monthlyBurnCents,
  };
}

/** ROE = resultado neto del ejercicio / patrimonio neto. */
export function roePercent(year: SabiYear): number | null {
  if (year.netResultCents === null || year.equityCents === null || year.equityCents === 0) {
    return null;
  }
  return (year.netResultCents / year.equityCents) * 100;
}

/** Margen de beneficio / margen neto = resultado neto / ventas. */
export function netProfitMarginPercent(year: SabiYear): number | null {
  return marginPercent(year.netResultCents, year.revenueCents);
}

/** True when interest cover is not meaningful: negative EBIT, negative ratio, or no financial expenses. */
export function interestCoverageIsNs(year: SabiYear): boolean {
  if (year.ebitCents !== null && year.ebitCents < 0) {
    return true;
  }
  const coverage = year.ratios.interestCoverage;
  if (typeof coverage !== "number" || !Number.isFinite(coverage)) {
    return year.ebitCents !== null;
  }
  return coverage < 0;
}

export const interestCoverageNsHint =
  "No significativo: el resultado de explotación es negativo o no hay gastos financieros, así que el múltiplo no dice nada.";

export type HeadlineEbitdaMargin = {
  primaryLabel: string;
  primaryBp: number | null;
  secondaryLabel: string | null;
  secondaryBp: number | null;
};

/**
 * When the seller has an adjusted EBITDA, the headline margin is adjusted / ventas.
 * The accounts (reported) margin stays as a secondary figure for the tooltip.
 */
export function headlineEbitdaMargin(input: {
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  hasAdjustments: boolean;
}): HeadlineEbitdaMargin {
  const reported = ebitdaMarginBasisPoints(input.ebitdaCents, input.revenueCents);
  if (!input.hasAdjustments) {
    return { primaryLabel: "Margen EBITDA", primaryBp: reported, secondaryLabel: null, secondaryBp: null };
  }
  return {
    primaryLabel: "Margen EBITDA ajustado",
    primaryBp: ebitdaMarginBasisPoints(input.adjustedEbitdaCents, input.revenueCents),
    secondaryLabel: "Margen EBITDA",
    secondaryBp: reported,
  };
}

export type HeadlineEbitda = {
  primaryCents: number;
  primaryLabel: "EBITDA" | "EBITDA aj.";
  secondaryCents: number | null;
  secondaryLabel: string | null;
  /** Pending rows and no approved ones: reported stays primary, with this flag for the chip. */
  pendingReview: boolean;
};

/**
 * Approved adjustments become the primary EBITDA everywhere (card, Resumen, ROI).
 * Pending-only stays on the accounts figure and surfaces "Ajuste en revisión".
 */
export function headlineEbitda(input: {
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  hasApprovedAdjustments: boolean;
  hasPendingAdjustments: boolean;
}): HeadlineEbitda {
  if (input.hasApprovedAdjustments) {
    return {
      primaryCents: input.adjustedEbitdaCents,
      primaryLabel: "EBITDA aj.",
      secondaryCents: input.ebitdaCents,
      secondaryLabel: "EBITDA de las cuentas",
      pendingReview: false,
    };
  }
  return {
    primaryCents: input.ebitdaCents,
    primaryLabel: "EBITDA",
    secondaryCents: null,
    secondaryLabel: null,
    pendingReview: input.hasPendingAdjustments,
  };
}
