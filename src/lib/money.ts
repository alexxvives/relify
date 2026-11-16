/** es-ES thousands with a dot, also for 4-digit numbers (Intl skips those): 1.500. */
export function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Decimal with a comma, at most `digits` decimals: 3,2. */
export function formatDecimal(value: number, digits = 1): string {
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor).replace(".", ",");
}

/** Whole euros or euros with cents when there are any: 1.500 € / 1.500,50 €. */
export function formatEurTrimmed(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.round(cents));
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const body = fraction === 0 ? groupThousands(whole) : `${groupThousands(whole)},${String(fraction).padStart(2, "0")}`;
  return `${negative ? "-" : ""}${body} €`;
}

export function formatEur(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.round(cents));
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const grouped = groupThousands(whole);
  return `${negative ? "-" : ""}${grouped},${String(fraction).padStart(2, "0")} €`;
}

export function formatWholeEur(cents: number): string {
  const negative = cents < 0;
  const euros = Math.round(Math.abs(cents) / 100);
  const grouped = groupThousands(euros);
  return `${negative ? "-" : ""}${grouped} €`;
}

function compactUnitDigits(scaled: number): number {
  if (scaled < 10) {
    return 2;
  }
  if (scaled < 100) {
    return 1;
  }
  return 0;
}

function formatScaled(scaled: number, digits: number): string {
  const factor = 10 ** digits;
  const rounded = Math.round(scaled * factor) / factor;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

/**
 * Shared compact money for cards, Resumen, ficha and marketplace:
 * 2 decimals below 10 of the unit (1,65 M), 1 decimal from 10–100, 0 above; space before K/M.
 */
export function formatCardEur(cents: number): string {
  const negative = cents < 0;
  const euros = Math.abs(cents) / 100;
  const sign = negative ? "-" : "";

  if (euros >= 999_950) {
    const millions = euros / 1_000_000;
    return `${sign}${formatScaled(millions, compactUnitDigits(millions))} M €`;
  }

  if (euros >= 1_000) {
    const thousands = euros / 1_000;
    return `${sign}${formatScaled(thousands, compactUnitDigits(thousands))} K €`;
  }

  return `${sign}${groupThousands(Math.round(euros))} €`;
}

export function formatCompactEur(cents: number): string {
  const negative = cents < 0;
  const euros = Math.abs(cents) / 100;
  const sign = negative ? "-" : "";

  if (euros >= 1_000_000) {
    const millions = euros / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
    return `${sign}${body} M €`;
  }

  if (euros >= 10_000) {
    return `${sign}${Math.round(euros / 1000)} mil €`;
  }

  const grouped = groupThousands(Math.round(euros));
  return `${sign}${grouped} €`;
}

export type RecoveryTone = "good" | "average" | "high";

export function recoveryYears(askingPriceCents: number, ebitdaCents: number): number | null {
  if (askingPriceCents <= 0 || ebitdaCents <= 0) {
    return null;
  }

  return askingPriceCents / ebitdaCents;
}

/**
 * S27: ROI as a yearly return on the asking price: EBITDA / precio de venta × 100 (equivalently 100 / payback
 * years). Uses the same primary EBITDA as the card (adjusted when approved). Null without a price or a positive EBITDA.
 */
export function roiPercent(askingPriceCents: number, ebitdaCents: number): number | null {
  if (askingPriceCents <= 0 || ebitdaCents <= 0) {
    return null;
  }

  return (ebitdaCents / askingPriceCents) * 100;
}

/** "33 %"-style label without the space: whole numbers from 10 %, one decimal below. */
export function formatRoiPercent(percent: number): string {
  const digits = percent >= 10 ? 0 : 1;
  return `${percent.toLocaleString("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}%`;
}

/** Same thresholds as the payback tone (≤4 years good, ≤7 average): ≥25 % good, ≥14,3 % average. */
export function roiTone(percent: number): RecoveryTone {
  return recoveryTone(100 / percent);
}

export function recoveryTone(years: number): RecoveryTone {
  if (years <= 4) {
    return "good";
  }

  if (years <= 7) {
    return "average";
  }

  return "high";
}

export function formatRecoveryYears(years: number): string {
  const rounded = Math.round(years * 10) / 10;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
  return `Recuperas la inversión en ~${body} años`;
}
