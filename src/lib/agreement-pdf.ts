import { letterPdf } from "./plain-pdf";
import { platformTermsCopy } from "./platform-terms";

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length === 0 ? word : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`))
    .join(" ");
}

export function agreementPdf(text: string): Buffer {
  const chunks = text
    .split("\n\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const heading = chunks[0] ?? "Documento";
  const date = chunks.find((part) => part.startsWith("Fecha:")) ?? "";
  const paragraphs = chunks.filter((part) => part !== heading && part !== date);

  return letterPdf({
    kicker: "Documento confidencial",
    title: titleCase(heading),
    date,
    lead: "Documento generado en Releva. La firma deja constancia en la cuenta.",
    paragraphs,
    signNote: "Firmar en Releva deja constancia. No es una firma electrónica cualificada.",
  });
}

export function agreementPdfDataUrl(text: string): string {
  return `data:application/pdf;base64,${agreementPdf(text).toString("base64")}`;
}

export function platformTermsPdf(when: string): Buffer {
  return letterPdf({
    kicker: "Acuerdo de la plataforma",
    title: platformTermsCopy.signedTitle,
    date: `${platformTermsCopy.signedOn} ${when}`,
    lead: platformTermsCopy.intro,
    paragraphs: [...platformTermsCopy.body],
    signNote: "La firma se guardó en la cuenta. No es una firma electrónica cualificada.",
  });
}

export function platformTermsPdfDataUrl(when: string): string {
  return `data:application/pdf;base64,${platformTermsPdf(when).toString("base64")}`;
}
