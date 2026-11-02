/**
 * t78: what a seller submission may change. Once the company's NIF is verified (stored CIF), the legal name and CIF
 * are locked to the stored values: buyers already in process must not see a renamed company. Admins edit elsewhere.
 */
export function lockedIdentity(
  existing: { legalName: string; cif: string } | null,
  submitted: { legalName: string; cif: string },
): { legalName: string; cif: string; locked: boolean } {
  if (existing && existing.cif.trim().length > 0) {
    return { legalName: existing.legalName, cif: existing.cif, locked: true };
  }
  return { ...submitted, locked: false };
}

export function identityChangeHref(email: string, codename: string): string {
  const subject = encodeURIComponent(`Solicitud de cambio de razón social / NIF — ${codename}`);
  const body = encodeURIComponent("Hola, quiero solicitar un cambio en el nombre legal o el NIF de mi empresa.\n\nDato actual:\nDato correcto:\nMotivo:\n");
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
