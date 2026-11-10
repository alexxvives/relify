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

export type HeadlineLeverageInput = {
  hasApprovedAdjustments: boolean;
  adjustedEbitdaCents: number | null;
};

/** Fondo de maniobra: activo corriente − pasivo corriente, always from that year's balance. */
export function fondoDeManiobraCents(year: SabiYear): number | null {
  if (year.currentAssetsCents === null || year.currentLiabilitiesCents === null) {
    return null;
  }
  return year.currentAssetsCents - year.currentLiabilitiesCents;
}

/**
 * NOF (necesidades operativas de fondos): operating working capital.
 * Activo corriente − caja − (pasivo corriente − deuda financiera a corto).
 */
export function nofCents(year: SabiYear): number | null {
  if (year.currentAssetsCents === null || year.currentLiabilitiesCents === null) {
    return null;
  }
  return year.currentAssetsCents - (year.cashCents ?? 0) - (year.currentLiabilitiesCents - (year.shortTermDebtCents ?? 0));
}

export function nofDeltaCents(last: SabiYear, previous: SabiYear | null): number | null {
  if (previous === null) {
    return null;
  }
  const lastNof = nofCents(last);
  const previousNof = nofCents(previous);
  if (lastNof === null || previousNof === null) {
    return null;
  }
  return lastNof - previousNof;
}

export function nofToSalesPercent(year: SabiYear): number | null {
  const nof = nofCents(year);
  if (nof === null || year.revenueCents === null || year.revenueCents <= 0) {
    return null;
  }
  return (nof / year.revenueCents) * 100;
}

export function leverageTimes(netDebt: number | null, ebitda: number | null): number | null {
  if (netDebt === null || ebitda === null || ebitda <= 0) {
    return null;
  }
  return netDebt / ebitda;
}

export type HeadlineLeverage = {
  primaryTimes: number | null;
  primaryLabel: string;
  secondaryTimes: number | null;
  secondaryLabel: string | null;
  ns: boolean;
  netDebtCents: number | null;
};

/**
 * DFN / EBITDA: approved adjusted EBITDA is the headline; accounts EBITDA stays in the tooltip.
 * n/s when there is debt but EBITDA is not positive.
 */
export function headlineLeverage(input: {
  netDebtCents: number | null;
  ebitdaCents: number | null;
  adjustedEbitdaCents: number | null;
  hasApprovedAdjustments: boolean;
}): HeadlineLeverage {
  const accounts = leverageTimes(input.netDebtCents, input.ebitdaCents);
  const headlineEbitdaCents =
    input.hasApprovedAdjustments && input.adjustedEbitdaCents !== null ? input.adjustedEbitdaCents : input.ebitdaCents;
  const primary = leverageTimes(input.netDebtCents, headlineEbitdaCents);
  const ns = input.netDebtCents !== null && input.netDebtCents > 0 && (headlineEbitdaCents === null || headlineEbitdaCents <= 0);
  if (!input.hasApprovedAdjustments || input.adjustedEbitdaCents === null) {
    return {
      primaryTimes: primary,
      primaryLabel: "Deuda neta / EBITDA",
      secondaryTimes: null,
      secondaryLabel: null,
      ns,
      netDebtCents: input.netDebtCents,
    };
  }
  return {
    primaryTimes: primary,
    primaryLabel: "Deuda neta / EBITDA aj.",
    secondaryTimes: accounts,
    secondaryLabel: "Deuda neta / EBITDA de las cuentas",
    ns,
    netDebtCents: input.netDebtCents,
  };
}

/**
 * Capex proxy for one closed year: Δ activo no corriente + (EBITDA − EBIT).
 * Amortizations are EBITDA − EBIT; the ANC change captures gross investment, approximately.
 */
export function capexProxyCents(last: SabiYear, previous: SabiYear | null): number | null {
  if (
    previous === null ||
    last.nonCurrentAssetsCents === null ||
    previous.nonCurrentAssetsCents === null ||
    last.ebitdaCents === null ||
    last.ebitCents === null
  ) {
    return null;
  }
  return last.nonCurrentAssetsCents - previous.nonCurrentAssetsCents + (last.ebitdaCents - last.ebitCents);
}

export function capexToSalesPercent(last: SabiYear, previous: SabiYear | null): number | null {
  const capex = capexProxyCents(last, previous);
  if (capex === null || last.revenueCents === null || last.revenueCents <= 0) {
    return null;
  }
  return (capex / last.revenueCents) * 100;
}

/** Three-year average of capex/ventas on years that have both the proxy and positive ventas. */
export function capexToSalesAverage(years: readonly SabiYear[]): number | null {
  const sorted = [...years].sort((left, right) => left.year - right.year);
  const shares: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (!current || !previous) {
      continue;
    }
    const share = capexToSalesPercent(current, previous);
    if (share !== null) {
      shares.push(share);
    }
  }
  const take = shares.slice(-3);
  if (take.length === 0) {
    return null;
  }
  return take.reduce((sum, share) => sum + share, 0) / take.length;
}

export type EbitdaCashConversion = { ratio: number | null; ns: boolean };

/**
 * Conversión EBITDA a caja, aproximada, last closed year:
 * (EBITDA − ΔNOF − capex proxy) / EBITDA. n/s if EBITDA ≤ 0.
 */
export function ebitdaToCashConversion(last: SabiYear, previous: SabiYear | null): EbitdaCashConversion | null {
  if (last.ebitdaCents === null) {
    return null;
  }
  if (last.ebitdaCents <= 0) {
    return { ratio: null, ns: true };
  }
  const delta = nofDeltaCents(last, previous);
  const capex = capexProxyCents(last, previous);
  if (delta === null || capex === null) {
    return null;
  }
  return { ratio: (last.ebitdaCents - delta - capex) / last.ebitdaCents, ns: false };
}

export function costPerEmployeeCents(year: SabiYear): number | null {
  if (year.staffCostsCents === null || year.employees === null || year.employees <= 0) {
    return null;
  }
  return Math.abs(year.staffCostsCents) / year.employees;
}

export function revenuePerEmployeeCents(year: SabiYear): number | null {
  if (year.revenueCents === null || year.employees === null || year.employees <= 0) {
    return null;
  }
  return year.revenueCents / year.employees;
}

export function collectionDaysOf(year: SabiYear): number | null {
  const days = year.ratios.collectionDays;
  return typeof days === "number" && Number.isFinite(days) ? days : null;
}

export function creditDaysOf(year: SabiYear): number | null {
  const days = year.ratios.creditDays;
  return typeof days === "number" && Number.isFinite(days) ? days : null;
}
