import { pdfBase64 } from "./plain-pdf";
import { platformTermsCopy } from "./platform-terms";
import { relifyEntity, relifyPartyLines } from "./relify-entity";
import { signedPdf } from "./signed-pdf";

export type SignedDocumentKind = "nda" | "advisor_nda" | "loi" | "terms";

export type DocumentSigner = {
  fullName: string;
  nationalId: string | null;
  /** "Comprador", "Vendedor", "Asesor"… */
  role: string;
};

const NOTE =
  "Firma electrónica simple registrada en Relify con la cuenta del firmante, su DNI/NIE y la fecha. No es una firma electrónica cualificada. El sello de Relify acredita que el documento se generó y custodia en la plataforma.";

const titles: Record<SignedDocumentKind, string> = {
  nda: "Acuerdo de confidencialidad",
  advisor_nda: "Acuerdo de confidencialidad del asesor",
  loi: "Carta de intenciones",
  terms: "Acuerdo de uso de Relify",
};

export function documentFileName(kind: SignedDocumentKind): string {
  return `${titles[kind].replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.pdf`;
}

function idLine(signer: DocumentSigner): string {
  return signer.nationalId ? `DNI/NIE: ${signer.nationalId}` : "DNI/NIE: se indica al firmar";
}

function relifySigner(signedAt: string | null) {
  return {
    role: "Por Relify",
    name: relifyEntity.name,
    idLine: relifyEntity.taxId ? `CIF: ${relifyEntity.taxId}` : `Plataforma · ${relifyEntity.web}`,
    stamp: true,
    signedAt,
  };
}

function userParty(signer: DocumentSigner) {
  return { role: signer.role, name: signer.fullName || "Usuario de Relify", lines: [idLine(signer), "Actúa en su propio nombre."] };
}

/** Splits the stored agreement text (heading, "Fecha:", intro, numbered clauses). */
function parseAgreement(text: string): { intro: string; clauses: string[] } {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const body = lines.slice(1).filter((line) => !line.startsWith("Fecha:"));
  const clauses = body.filter((line) => /^\d+\.\s/.test(line));
  const intro = body.filter((line) => !/^\d+\.\s/.test(line)).join(" ");
  return { intro, clauses: clauses.length > 0 ? clauses : body };
}

export function dealDocumentPdf(input: {
  kind: Exclude<SignedDocumentKind, "terms">;
  text: string;
  signer: DocumentSigner;
  signature?: Uint8Array | null;
  signedAt?: string | null;
  dateLabel: string;
  reference: string;
}): Uint8Array<ArrayBuffer> {
  const { intro, clauses } = parseAgreement(input.text);
  const draft = !input.signature && !input.signedAt;
  return signedPdf({
    title: titles[input.kind],
    reference: input.reference,
    dateLabel: input.dateLabel,
    parties: [userParty(input.signer), { role: "La plataforma", name: relifyEntity.name, lines: relifyPartyLines() }],
    intro,
    clauses,
    signers: [
      { role: input.signer.role, name: input.signer.fullName, idLine: idLine(input.signer), signature: input.signature ?? null, signedAt: input.signedAt ?? null },
      relifySigner(input.signedAt ?? null),
    ],
    note: NOTE,
    draft,
  });
}

export function termsDocumentPdf(input: {
  signer: DocumentSigner;
  signature?: Uint8Array | null;
  signedAt?: string | null;
  dateLabel: string;
  reference: string;
}): Uint8Array<ArrayBuffer> {
  return signedPdf({
    title: `${titles.terms} · ${input.signer.role}`,
    reference: input.reference,
    dateLabel: input.dateLabel,
    parties: [userParty(input.signer), { role: "La plataforma", name: relifyEntity.name, lines: relifyPartyLines() }],
    intro: platformTermsCopy.intro,
    clauses: [...platformTermsCopy.body],
    signers: [
      { role: input.signer.role, name: input.signer.fullName, idLine: idLine(input.signer), signature: input.signature ?? null, signedAt: input.signedAt ?? null },
      relifySigner(input.signedAt ?? null),
    ],
    note: NOTE,
    draft: !input.signedAt,
  });
}

/** Unsigned preview shown before signing (runs in the browser). */
export function agreementPdfDataUrl(text: string, kind: Exclude<SignedDocumentKind, "terms"> = "nda", role = "Firmante"): string {
  const heading = text.split("\n")[0] ?? "";
  const resolved: Exclude<SignedDocumentKind, "terms"> = heading.includes("CARTA")
    ? "loi"
    : heading.includes("ASESOR")
      ? "advisor_nda"
      : kind;
  const name = (text.match(/\n\n(.+?),\s(?:como|comprador)/)?.[1] ?? "").trim();
  const date = text.match(/Fecha:\s*(.+)/)?.[1] ?? "";
  const bytes = dealDocumentPdf({
    kind: resolved,
    text,
    signer: { fullName: name, nationalId: null, role: resolved === "advisor_nda" ? "Asesor" : role === "Firmante" ? "Comprador" : role },
    dateLabel: date,
    reference: "Borrador",
  });
  return `data:application/pdf;base64,${pdfBase64(bytes)}`;
}
