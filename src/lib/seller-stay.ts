import * as z from "zod";

/**
 * t93: would the seller stay on as an adviser after the sale, and for how long. A deal term, never identifying, so a
 * buyer sees it before the NDA. Recommended, never required to publish.
 */
export const sellerStayOptions = ["no", "1w", "1m", "3m", "6m", "1y", "2y"] as const;
export type SellerStay = (typeof sellerStayOptions)[number];

export const sellerStayLabels: Record<SellerStay, string> = {
  no: "No",
  "1w": "1 semana",
  "1m": "1 mes",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
  "2y": "2 años",
};

export const sellerStayInputSchema = { sellerStay: z.union([z.literal(""), z.enum(sellerStayOptions)]) };

/** Reads the stored column defensively; unknown values read as unanswered. */
export function storedSellerStay(value: string | null | undefined): SellerStay | null {
  return sellerStayOptions.find((option) => option === value) ?? null;
}

/** Buyer-facing sentence in Operación de venta, e.g. "Se queda como asesor 3 meses". */
export function sellerStayText(value: SellerStay): string {
  return value === "no" ? "No se queda tras la venta" : `Se queda como asesor ${sellerStayLabels[value]}`;
}
