import type { SabiHolding } from "@/lib/sabi/parse";

/** t68: one SABI-imported financial year, as plain numbers (euro cents) for the visual ficha. Null = not published. */
export type SabiYear = {
  year: number;
  months: number | null;
  employees: number | null;
  revenueCents: number | null;
  suppliesCents: number | null;
  staffCostsCents: number | null;
  ebitdaCents: number | null;
  ebitCents: number | null;
  financialResultCents: number | null;
  profitBeforeTaxCents: number | null;
  netResultCents: number | null;
  totalAssetsCents: number | null;
  nonCurrentAssetsCents: number | null;
  currentAssetsCents: number | null;
  cashCents: number | null;
  equityCents: number | null;
  nonCurrentLiabilitiesCents: number | null;
  currentLiabilitiesCents: number | null;
  longTermDebtCents: number | null;
  shortTermDebtCents: number | null;
  workingCapitalCents: number | null;
  ratios: Record<string, number>;
};

type Num = bigint | number | null | undefined;

function num(value: Num): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export type SabiYearRow = {
  year: number;
  months: number | null;
  employees: number | null;
  ratios: unknown;
  salesCents: Num;
  operatingRevenueCents: Num;
  suppliesCents: Num;
  staffCostsCents: Num;
  ebitdaCents: Num;
  ebitCents: Num;
  financialResultCents: Num;
  profitBeforeTaxCents: Num;
  netResultCents: Num;
  totalAssetsCents: Num;
  nonCurrentAssetsCents: Num;
  currentAssetsCents: Num;
  cashCents: Num;
  equityCents: Num;
  nonCurrentLiabilitiesCents: Num;
  currentLiabilitiesCents: Num;
  longTermDebtCents: Num;
  shortTermDebtCents: Num;
  workingCapitalCents: Num;
};

export function toSabiYear(row: SabiYearRow): SabiYear {
  const ratios: Record<string, number> = {};
  if (row.ratios && typeof row.ratios === "object" && !Array.isArray(row.ratios)) {
    for (const [key, value] of Object.entries(row.ratios as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        ratios[key] = value;
      }
    }
  }

  return {
    year: row.year,
    months: row.months,
    employees: row.employees,
    revenueCents: num(row.salesCents) ?? num(row.operatingRevenueCents),
    suppliesCents: num(row.suppliesCents),
    staffCostsCents: num(row.staffCostsCents),
    ebitdaCents: num(row.ebitdaCents),
    ebitCents: num(row.ebitCents),
    financialResultCents: num(row.financialResultCents),
    profitBeforeTaxCents: num(row.profitBeforeTaxCents),
    netResultCents: num(row.netResultCents),
    totalAssetsCents: num(row.totalAssetsCents),
    nonCurrentAssetsCents: num(row.nonCurrentAssetsCents),
    currentAssetsCents: num(row.currentAssetsCents),
    cashCents: num(row.cashCents),
    equityCents: num(row.equityCents),
    nonCurrentLiabilitiesCents: num(row.nonCurrentLiabilitiesCents),
    currentLiabilitiesCents: num(row.currentLiabilitiesCents),
    longTermDebtCents: num(row.longTermDebtCents),
    shortTermDebtCents: num(row.shortTermDebtCents),
    workingCapitalCents: num(row.workingCapitalCents),
    ratios,
  };
}

/** Share of revenue in percent, or null when either side is missing or revenue is not positive. */
export function marginPercent(part: number | null, revenue: number | null): number | null {
  if (part === null || revenue === null || revenue <= 0) {
    return null;
  }

  return (part / revenue) * 100;
}

/** Financial debt = long-term creditors + short-term financial debt (null when neither is published). */
export function financialDebtCents(year: SabiYear): number | null {
  if (year.longTermDebtCents === null && year.shortTermDebtCents === null) {
    return null;
  }

  return (year.longTermDebtCents ?? 0) + (year.shortTermDebtCents ?? 0);
}

export function netDebtCents(year: SabiYear): number | null {
  const debt = financialDebtCents(year);
  return debt === null || year.cashCents === null ? null : debt - year.cashCents;
}

/** Net debt / EBITDA in years; only meaningful with positive EBITDA. */
export function netDebtToEbitda(year: SabiYear): number | null {
  const net = netDebtCents(year);
  return net === null || year.ebitdaCents === null || year.ebitdaCents <= 0 ? null : net / year.ebitdaCents;
}

/** Relative change between the two last values that exist, in percent (null when not computable). */
export function yearOverYear(values: Array<number | null>): { delta: number; previous: number } | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length < 2) {
    return null;
  }

  const last = present[present.length - 1]!;
  const previous = present[present.length - 2]!;
  return { delta: last - previous, previous };
}

export type WaterfallStep = { label: string; value: number; kind: "start" | "delta" | "subtotal" | "total" };

/** P&L bridge for one year, from revenue to net result. Each delta is derived from published subtotals, so the chain always reconciles. */
export function pnlWaterfall(year: SabiYear): WaterfallStep[] {
  const revenue = year.revenueCents;
  const net = year.netResultCents;
  if (revenue === null || net === null) {
    return [];
  }

  const steps: WaterfallStep[] = [{ label: "Ventas", value: revenue, kind: "start" }];
  let running = revenue;
  const push = (label: string, target: number | null, subtotal: string | null) => {
    if (target === null) {
      return;
    }

    if (target !== running) {
      steps.push({ label, value: target - running, kind: "delta" });
    }

    if (subtotal) {
      steps.push({ label: subtotal, value: target, kind: "subtotal" });
    }

    running = target;
  };

  if (year.ebitdaCents !== null) {
    const supplies = year.suppliesCents !== null && year.suppliesCents !== 0 ? -Math.abs(year.suppliesCents) : 0;
    const staff = year.staffCostsCents !== null && year.staffCostsCents !== 0 ? -Math.abs(year.staffCostsCents) : 0;
    if (supplies !== 0) {
      steps.push({ label: "Aprovisionamientos", value: supplies, kind: "delta" });
    }

    if (staff !== 0) {
      steps.push({ label: "Gastos de personal", value: staff, kind: "delta" });
    }

    running += supplies + staff;
    push("Otros gastos de explotación", year.ebitdaCents, "EBITDA");
  }

  push("Amortizaciones", year.ebitCents, "EBIT");
  push("Resultado financiero", year.profitBeforeTaxCents, "Resultado antes de impuestos");
  push("Impuesto sobre beneficios", net, null);
  steps.push({ label: "Resultado del ejercicio", value: net, kind: "total" });
  return steps;
}

/** "100,00" → 10000 bp; ">50,00" → 5000 bp flagged as a lower bound; "-" / blank → null. */
export function parseSabiPercent(text: string | null | undefined): { basisPoints: number; atLeast: boolean } | null {
  if (!text) {
    return null;
  }

  const match = /^\s*([<>]?)\s*(\d+(?:[.,]\d+)?)\s*%?\s*$/.exec(text);
  if (!match || match[1] === "<") {
    return null;
  }

  const value = Number(match[2]!.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    return null;
  }

  return { basisPoints: Math.round(value * 100), atLeast: match[1] === ">" };
}

export type OwnershipSlice = { label: string; basisPoints: number; detail?: string };

/**
 * Pie slices from SABI's shareholder list: holders with a published % (direct, else total) get their share,
 * ">50,00" is drawn as 50 % and labelled "> 50 %", and the remainder is one grey "rest" slice naming how many holders have no % in SABI.
 */
export function sabiOwnershipSlices(holdings: SabiHolding[]): OwnershipSlice[] {
  const slices: OwnershipSlice[] = [];
  let unknown = 0;
  for (const holder of holdings) {
    const share = parseSabiPercent(holder.direct) ?? parseSabiPercent(holder.total);
    if (!share) {
      unknown += 1;
      continue;
    }

    slices.push({ label: holder.name, basisPoints: share.basisPoints, ...(share.atLeast ? { detail: `> ${(share.basisPoints / 100).toLocaleString("es-ES")} %` } : {}) });
  }

  if (slices.length === 0) {
    return [];
  }

  const used = slices.reduce((sum, slice) => sum + slice.basisPoints, 0);
  if (used > 10000) {
    return slices.map((slice) => ({ ...slice, basisPoints: Math.round((slice.basisPoints * 10000) / used) }));
  }

  if (used < 10000) {
    const lowerBound = slices.some((slice) => slice.detail);
    const label = unknown > 0 ? `Resto (${unknown} ${unknown === 1 ? "accionista" : "accionistas"} sin % definido)` : "Resto (sin identificar en el registro)";
    slices.push({ label, basisPoints: 10000 - used, ...(lowerBound ? { detail: `< ${((10000 - used) / 100).toLocaleString("es-ES")} %` } : {}) });
  }

  return slices;
}
