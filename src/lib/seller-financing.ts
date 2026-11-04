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

export type SellerFinancingErrors = { pct?: string; years?: string };

/** Field-level problems; only filled fields are judged, except that "Sí" needs both terms. */
export function sellerFinancingErrors(input: SellerFinancingInput): SellerFinancingErrors {
  const errors: SellerFinancingErrors = {};
  if (input.sellerFinancing === "" || input.sellerFinancing === "no") {
    return errors;
  }
  const pct = input.sellerFinancingPct.trim();
  const years = input.sellerFinancingYears.trim();
  if (pct !== "" && !(/^\d{1,3}$/.test(pct) && Number(pct) >= 1 && Number(pct) <= 100)) {
    errors.pct = "Indica un porcentaje entero entre 1 y 100.";
  } else if (pct === "" && input.sellerFinancing === "yes") {
    errors.pct = "Indica qué parte del precio financiarías.";
  }
  if (years !== "" && !sellerFinancingYearOptions.some((option) => String(option) === years)) {
    errors.years = "Elige un plazo de la lista.";
  } else if (years === "" && input.sellerFinancing === "yes") {
    errors.years = "Elige el plazo.";
  }
  return errors;
}

/** What gets stored: null columns when unanswered; terms are dropped for "No". Invalid input returns ok: false. */
export function sellerFinancingWrite(
  input: SellerFinancingInput,
): { ok: true; data: { sellerFinancing: SellerFinancingMode | null; sellerFinancingMaxPct: number | null; sellerFinancingYears: number | null } } | { ok: false } {
  if (Object.keys(sellerFinancingErrors(input)).length > 0) {
    return { ok: false };
  }
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

function yearsText(years: number): string {
  return years >= 5 ? "5 años o más" : years === 1 ? "1 año" : `${years} años`;
}

/** t92: marketplace card chip. Only for Sí or Negociable; nothing for No or unanswered. */
export function sellerFinancingChip(value: SellerFinancing | null): string | null {
  if (!value || value.mode === "no") {
    return null;
  }
  return value.maxPct !== null ? `Financia hasta ${value.maxPct} %` : "Financiación vendedor";
}

/** Buyer-facing sentence, e.g. "Acepta financiar hasta un 20 % a 3 años". */
export function sellerFinancingText(value: SellerFinancing): string {
  if (value.mode === "no") {
    return "No";
  }
  const parts = [value.maxPct !== null ? `hasta un ${value.maxPct} %` : null, value.years !== null ? `a ${yearsText(value.years)}` : null].filter(Boolean);
  if (value.mode === "yes") {
    return parts.length > 0 ? `Acepta financiar ${parts.join(" ")}` : "Acepta financiar parte del precio";
  }
  return parts.length > 0 ? `A negociar (orientativo: ${parts.join(" ")})` : "A negociar";
}
