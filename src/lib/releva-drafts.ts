import { loiAgreement, ndaAgreement } from "./deal-documents";
import { letterPdf, type LetterPdfInput } from "./plain-pdf";

export const relevaDraftFolder = "Relify";

export const relevaDrafts = [
  { id: "releva-nda", fileName: "Acuerdo-de-confidencialidad.pdf" },
  { id: "releva-loi", fileName: "Carta-de-intenciones.pdf" },
] as const;

const intro =
  "Borrador de Relify. Al firmar se rellenan el nombre del comprador, el apodo del proyecto y la provincia. Este archivo no incluye la razón social, el CIF ni el domicilio.";

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

const signNote = "La firma se hace desde el proceso. Deja constancia y no es una firma electrónica cualificada.";

function letterFor(id: string): LetterPdfInput | null {
  const agreement =
    id === "releva-nda"
      ? ndaAgreement({
          buyerName: "El comprador",
          codename: "el proyecto",
          region: "la provincia",
          dateLabel: "la fecha de la firma",
        })
      : id === "releva-loi"
        ? loiAgreement({
            buyerName: "El comprador",
            codename: "el proyecto",
            region: "la provincia",
            askingPrice: "el precio de la ficha",
            dateLabel: "la fecha de la firma",
          })
        : null;

  if (agreement === null) {
    return null;
  }

  const chunks = agreement
    .split("\n\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const date = chunks.find((part) => part.startsWith("Fecha:")) ?? "";
  const paragraphs = chunks.filter((part) => part !== chunks[0] && part !== date);

  return {
    kicker: "Documento confidencial",
    title: id === "releva-nda" ? "Acuerdo de confidencialidad" : "Carta de intenciones",
    date,
    lead: intro,
    paragraphs,
    signNote,
  };
}

export function relevaDraftPdf(id: string): { fileName: string; bytes: Uint8Array<ArrayBuffer> } | null {
  const draft = relevaDrafts.find((item) => item.id === id);
  const letter = letterFor(id);

  if (!draft || letter === null) {
    return null;
  }

  return { fileName: draft.fileName, bytes: letterPdf(letter) };
}
