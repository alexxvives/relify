import * as z from "zod";

/**
 * t90: seller financing (pago aplazado / vendor loan). The seller says whether they would let the buyer pay part of
 * the price later, up to which share and over how many years. Deal terms, not financials: never identifying, so a
 * buyer sees them before the NDA.
 */
export const sellerFinancingModes = ["yes", "no", "negotiable"] as const;
export type SellerFinancingMode = (typeof sellerFinancingModes)[number];

export const sellerFinancingLabels: Record<SellerFinancingMode, string> = {
  yes: "Sí",
  no: "No",
  negotiable: "Negociable",
};

/** Plazo options in years; 5 means "5 años o más". */
export const sellerFinancingYearOptions = [1, 2, 3, 4, 5] as const;

export type SellerFinancing = { mode: SellerFinancingMode; maxPct: number | null; years: number | null };

/** Form values as the seller form holds them ("" = not answered). */
export type SellerFinancingInput = { sellerFinancing: string; sellerFinancingPct: string; sellerFinancingYears: string };

export const sellerFinancingInputSchema = {
  sellerFinancing: z.union([z.literal(""), z.enum(sellerFinancingModes)]),
  sellerFinancingPct: z.string().trim().max(3),
  sellerFinancingYears: z.string().trim().max(2),
};

/** What gets stored: null columns when unanswered; terms are dropped for "No". Invalid input returns ok: false. */
export function sellerFinancingWrite(
  input: SellerFinancingInput,
): { ok: true; data: { sellerFinancing: SellerFinancingMode | null; sellerFinancingMaxPct: number | null; sellerFinancingYears: number | null } } | { ok: false } {
  const mode = input.sellerFinancing === "" ? null : (input.sellerFinancing as SellerFinancingMode);
  const terms = mode === "yes" || mode === "negotiable";
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

/** Reads the stored columns defensively. */
export function storedSellerFinancing(record: { sellerFinancing?: string | null; sellerFinancingMaxPct?: number | null; sellerFinancingYears?: number | null }): SellerFinancing | null {
  const mode = sellerFinancingModes.find((known) => known === record.sellerFinancing);
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

/** t92/t93: marketplace card chip. Only for Sí or Negociable; nothing for No or unanswered. */
export function sellerFinancingChip(value: SellerFinancing | null): string | null {
  return !value || value.mode === "no" ? null : "Financiación vendedor";
}

/** t93: buyer-facing sentence in Operación de venta. */
export function sellerFinancingText(value: SellerFinancing): string {
  return value.mode === "no" ? "No" : value.mode === "yes" ? "Acepta financiar parte del precio" : "Financiación negociable";
}
