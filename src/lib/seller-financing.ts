import * as z from "zod";

/**
 * t90: seller financing (pago aplazado / vendor loan). The seller says whether they would let the buyer pay part of
 * the price later, up to which share and over how many years. Deal terms, not financials: never identifying, so a
 * buyer sees them before the NDA.
 */
export const sellerFinancingModes = ["yes", "no"] as const;
export type SellerFinancingMode = (typeof sellerFinancingModes)[number];

export const sellerFinancingLabels: Record<SellerFinancingMode, string> = {
  yes: "Sí",
  no: "No",
};

/** Plazo options in years; 5 means "5 años o más". */
export const sellerFinancingYearOptions = [1, 2, 3, 4, 5] as const;

export const sellerFinancingYearLabels: Record<(typeof sellerFinancingYearOptions)[number], string> = {
  1: "1 año",
  2: "2 años",
  3: "3 años",
  4: "4 años",
  5: "5 años o más",
};

export type SellerFinancing = { mode: SellerFinancingMode; maxPct: number | null; years: number | null };

/** Form values as the seller form holds them ("" = not answered). */
export type SellerFinancingInput = { sellerFinancing: string; sellerFinancingPct: string; sellerFinancingYears: string };

export const sellerFinancingInputSchema = {
  sellerFinancing: z.union([z.literal(""), z.enum(sellerFinancingModes), z.literal("negotiable")]),
  sellerFinancingPct: z.string().trim().max(3),
  sellerFinancingYears: z.string().trim().max(2),
};

function postedFinancingMode(value: string): SellerFinancingMode | null {
  if (value === "") {
    return null;
  }
  if (value === "negotiable" || value === "yes") {
    return "yes";
  }
  if (value === "no") {
    return "no";
  }
  return null;
}

/** What gets stored: null columns when unanswered; terms are dropped for "No". Invalid input returns ok: false. */
export function sellerFinancingWrite(
  input: SellerFinancingInput,
): { ok: true; data: { sellerFinancing: SellerFinancingMode | null; sellerFinancingMaxPct: number | null; sellerFinancingYears: number | null } } | { ok: false } {
  const mode = postedFinancingMode(input.sellerFinancing);
  const terms = mode === "yes";
  const pct = input.sellerFinancingPct.trim();
  const years = input.sellerFinancingYears.trim();
  return {
    ok: true,
    data: {
      sellerFinancing: mode,
      sellerFinancingMaxPct: terms && pct !== "" ? Number(pct) : null,
      sellerFinancingYears: terms && years !== "" ? Number(years) : null,
    },
  };
}

/** Reads the stored columns defensively. Leftover "negotiable" (prod until the INT data migration) is Sí. */
export function storedSellerFinancing(record: { sellerFinancing?: string | null; sellerFinancingMaxPct?: number | null; sellerFinancingYears?: number | null }): SellerFinancing | null {
  const mode = postedFinancingMode(record.sellerFinancing ?? "");
  if (!mode) {
    return null;
  }
  const pct = record.sellerFinancingMaxPct;
  const years = record.sellerFinancingYears;
  return {
    mode,
    maxPct: mode !== "no" && typeof pct === "number" && pct >= 1 && pct <= 100 ? pct : null,
    years: mode !== "no" && typeof years === "number" && years >= 1 ? years : null,
  };
}

export function sellerFinancingToInput(value: SellerFinancing | null): SellerFinancingInput {
  return {
    sellerFinancing: value?.mode ?? "",
    sellerFinancingPct: value?.maxPct != null ? String(value.maxPct) : "",
    sellerFinancingYears: value?.years != null ? String(value.years) : "",
  };
}

/** t92/t93: marketplace card chip. Only for Sí; nothing for No or unanswered. */
export function sellerFinancingChip(value: SellerFinancing | null): string | null {
  return !value || value.mode === "no" ? null : "Financiación vendedor";
}

function sellerFinancingYearText(years: number): string {
  if (years === 1) return sellerFinancingYearLabels[1];
  if (years === 2) return sellerFinancingYearLabels[2];
  if (years === 3) return sellerFinancingYearLabels[3];
  if (years === 4) return sellerFinancingYearLabels[4];
  if (years >= 5) return sellerFinancingYearLabels[5];
  return `${years} años`;
}

function sellerFinancingTerms(value: SellerFinancing): string {
  const parts: string[] = [];
  if (value.maxPct != null) parts.push(`hasta el ${value.maxPct} %`);
  if (value.years != null) parts.push(sellerFinancingYearText(value.years));
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

/** t93: buyer-facing sentence in Operación de venta. */
export function sellerFinancingText(value: SellerFinancing): string {
  if (value.mode === "no") return "No";
  return `Acepta financiar parte del precio${sellerFinancingTerms(value)}`;
}
