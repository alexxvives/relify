/**
 * Relify as the company party on signed documents. Legal name, CIF and address are
 * left empty until the company details are confirmed; empty values are not printed.
 */
export const relifyEntity = {
  name: "Relify",
  legalName: "",
  taxId: "",
  address: "",
  web: "itsrelify.com",
} as const;

export function relifyPartyLines(): string[] {
  return [
    relifyEntity.legalName ? `Razón social: ${relifyEntity.legalName}` : "",
    relifyEntity.taxId ? `CIF: ${relifyEntity.taxId}` : "",
    relifyEntity.address ? `Domicilio: ${relifyEntity.address}` : "",
    `Plataforma: ${relifyEntity.web}`,
    "En calidad de plataforma que intermedia y custodia el documento.",
  ].filter((line) => line.length > 0);
}
