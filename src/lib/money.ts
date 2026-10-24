export function formatEur(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.round(cents));
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped},${String(fraction).padStart(2, "0")} €`;
}

export function formatWholeEur(cents: number): string {
  const negative = cents < 0;
  const euros = Math.round(Math.abs(cents) / 100);
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped} €`;
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

  const grouped = String(Math.round(euros)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped} €`;
}

/** Short card figure in es-ES: 1,25 M €, 850 K €, 9.500 €. */
export function formatCardEur(cents: number): string {
  const negative = cents < 0;
  const euros = Math.abs(cents) / 100;
  const sign = negative ? "-" : "";

  if (euros >= 1_000_000) {
    const rounded = Math.round((euros / 1_000_000) * 100) / 100;
    return `${sign}${String(rounded).replace(".", ",")} M €`;
  }

  if (euros >= 10_000) {
    return `${sign}${Math.round(euros / 1000)} K €`;
  }

  const grouped = String(Math.round(euros)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped} €`;
}

export type RecoveryTone = "good" | "average" | "high";

export function recoveryYears(askingPriceCents: number, ebitdaCents: number): number | null {
  if (askingPriceCents <= 0 || ebitdaCents <= 0) {
    return null;
  }

  return askingPriceCents / ebitdaCents;
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
  return `ROI de ${body} años`;
}
