import { loiAgreement, ndaAgreement } from "./deal-documents";
import { plainPdf } from "./plain-pdf";

export const relevaDraftFolder = "Releva";

export const relevaDrafts = [
  { id: "releva-nda", fileName: "Acuerdo-de-confidencialidad.pdf" },
  { id: "releva-loi", fileName: "Carta-de-intenciones.pdf" },
] as const;

const intro =
  "Borrador de Releva. Al firmar se rellenan el nombre del comprador, el apodo del proyecto y la provincia. Este archivo no incluye la razón social, el CIF ni el domicilio.";

export function relevaDraftText(id: string): string | null {
  if (id === "releva-nda") {
    return `${intro}\n\n${ndaAgreement({
      buyerName: "El comprador",
      codename: "el proyecto",
      region: "la provincia",
      dateLabel: "la fecha de la firma",
    })}`;
  }

  if (id === "releva-loi") {
    return `${intro}\n\n${loiAgreement({
      buyerName: "El comprador",
      codename: "el proyecto",
      region: "la provincia",
      askingPrice: "el precio de la ficha",
      dateLabel: "la fecha de la firma",
    })}`;
  }

  return null;
}

export function relevaDraftPdf(id: string): { fileName: string; bytes: Buffer } | null {
  const draft = relevaDrafts.find((item) => item.id === id);
  const text = relevaDraftText(id);

  if (!draft || text === null) {
    return null;
  }

  return { fileName: draft.fileName, bytes: plainPdf(text) };
}
