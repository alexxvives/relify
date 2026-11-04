import { adjustedEbitdaCents, parseEbitdaAdjustments, type EbitdaAdjustment } from "./ebitda-adjustments";

/**
 * t78: what a seller submission may change. Once the company's NIF is verified (stored CIF), the legal name and CIF
 * are locked to the stored values: buyers already in process must not see a renamed company. Admins edit elsewhere.
 */
export function lockedIdentity(
  existing: { legalName: string; cif: string } | null,
  submitted: { legalName: string; cif: string },
): { legalName: string; cif: string; locked: boolean } {
  if (existing && existing.cif.trim().length > 0) {
    // A stored project whose legal name was never written (registry prefill not yet saved)
    // takes the submitted one once; after that it is locked like the CIF.
    const legalName = existing.legalName.trim().length > 0 ? existing.legalName : submitted.legalName;
    return { legalName, cif: existing.cif, locked: true };
  }
  return { ...submitted, locked: false };
}

function euroCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,12}(,\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, decimals = ""] = trimmed.split(",");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

/**
 * t78: money fields a seller submission may write. Revenue, EBITDA, OPEX and the yearly accounts come from the
 * registry / our team and are ignored. The asking price is seller-asserted; empty keeps the stored value.
 * t82: the adjusted EBITDA is no longer typed: it is derived from the adjustment list (sellerAdjustmentFields).
 * New projects get zeros for the non-null columns.
 */
export function sellerMoneyFields(
  input: { askingPrice: string },
  isNew: boolean,
  priceAllowed = true,
): { askingPriceCents?: number; adjustedEbitdaCents?: number; revenueCents?: number; ebitdaCents?: number; opexCents?: null } {
  // t94: without a positive EBITDA basis the submitted price is ignored (the stored one is kept, a new project gets 0).
  const askingPriceCents = priceAllowed ? euroCents(input.askingPrice) : null;
  return {
    ...(askingPriceCents !== null ? { askingPriceCents } : isNew ? { askingPriceCents: 0 } : {}),
    ...(isNew ? { adjustedEbitdaCents: 0, revenueCents: 0, ebitdaCents: 0, opexCents: null } : {}),
  };
}

export type AdjustmentWrite =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "set"; rows: EbitdaAdjustment[]; adjustedEbitdaCents: number };

/**
 * t82: what the posted adjustment list writes. `raw` is the hidden JSON field; an absent field ("") keeps whatever is
 * stored (a legacy declared figure stays as is). "[]" removes a list the seller had and clears the adjusted figure.
 * The adjusted EBITDA is always the stored accounts EBITDA plus the rows; any total the client sends is ignored.
 */
export function sellerAdjustmentWrite(
  raw: string,
  stored: { ebitdaCents: number; hasList: boolean } | null,
): { ok: true; write: AdjustmentWrite } | { ok: false; code: string } {
  if (raw.trim() === "") {
    return { ok: true, write: { kind: "keep" } };
  }
  const parsed = parseEbitdaAdjustments(raw);
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.rows.length === 0) {
    return { ok: true, write: stored?.hasList ? { kind: "clear" } : { kind: "keep" } };
  }
  return {
    ok: true,
    write: { kind: "set", rows: parsed.rows, adjustedEbitdaCents: adjustedEbitdaCents(stored?.ebitdaCents ?? 0, parsed.rows) },
  };
}

/**
 * t94: the EBITDA the asking price rests on: the adjusted EBITDA when the seller has adjustments, otherwise the
 * accounts EBITDA (the same basis as the orientative range). A price may only be set while it is positive.
 */
export function priceBasisCents(input: { hasAdjustments: boolean; adjustedEbitdaCents: number | null; ebitdaCents: number | null }): number | null {
  return input.hasAdjustments ? input.adjustedEbitdaCents : input.ebitdaCents;
}

export function askingPriceAllowed(basisCents: number | null): boolean {
  return basisCents !== null && Number.isFinite(basisCents) && basisCents > 0;
}

/**
 * t95: the one publishability rule, from what is stored on the project. Adjustments count when the seller saved a
 * non-empty list, or (legacy, no list) a non-zero adjusted EBITDA. Used by the price lock, the seller overview and
 * the review/publish gate so they always agree.
 */
export function storedPriceBasisCents(project: { ebitdaCents: number | bigint | null; adjustedEbitdaCents: number | bigint | null; ebitdaAdjustments: unknown }): number | null {
  const adjusted = project.adjustedEbitdaCents === null ? null : Number(project.adjustedEbitdaCents);
  const hasAdjustments = Array.isArray(project.ebitdaAdjustments)
    ? project.ebitdaAdjustments.length > 0
    : project.ebitdaAdjustments === null || project.ebitdaAdjustments === undefined
      ? adjusted !== null && adjusted !== 0
      : false;
  return priceBasisCents({ hasAdjustments, adjustedEbitdaCents: adjusted, ebitdaCents: project.ebitdaCents === null ? null : Number(project.ebitdaCents) });
}

/** t95: a company is publishable only with a positive basis (adjusted EBITDA when adjusted, else EBITDA). */
export function ebitdaPublishable(project: Parameters<typeof storedPriceBasisCents>[0]): boolean {
  return askingPriceAllowed(storedPriceBasisCents(project));
}
