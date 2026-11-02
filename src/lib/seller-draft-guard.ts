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

export function identityChangeHref(email: string, codename: string): string {
  const subject = encodeURIComponent(`Solicitud de cambio de razón social / NIF — ${codename}`);
  const body = encodeURIComponent("Hola, quiero solicitar un cambio en el nombre legal o el NIF de mi empresa.\n\nDato actual:\nDato correcto:\nMotivo:\n");
  return `mailto:${email}?subject=${subject}&body=${body}`;
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
 * registry / our team and are ignored. Asking price and adjusted EBITDA are seller-asserted; empty keeps the stored value.
 * New projects get zeros for the non-null columns.
 */
export function sellerMoneyFields(
  input: { askingPrice: string; adjustedEbitda: string },
  isNew: boolean,
): { askingPriceCents?: number; adjustedEbitdaCents?: number; revenueCents?: number; ebitdaCents?: number; opexCents?: null } {
  const askingPriceCents = euroCents(input.askingPrice);
  const adjustedEbitdaCents = euroCents(input.adjustedEbitda);
  return {
    ...(askingPriceCents !== null ? { askingPriceCents } : isNew ? { askingPriceCents: 0 } : {}),
    ...(adjustedEbitdaCents !== null ? { adjustedEbitdaCents } : isNew ? { adjustedEbitdaCents: 0 } : {}),
    ...(isNew ? { revenueCents: 0, ebitdaCents: 0, opexCents: null } : {}),
  };
}
