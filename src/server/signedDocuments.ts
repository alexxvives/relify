import {
  dealDocumentPdf,
  documentFileName,
  termsDocumentPdf,
  type DocumentSigner,
  type SignedDocumentKind,
} from "@/lib/agreement-pdf";
import { advisorNdaAgreement, loiAgreement, ndaAgreement, spanishDate } from "@/lib/deal-documents";
import { jpegSize } from "@/lib/signature-image";
import { prisma } from "@/server/db";

export type StoredDocument = { fileName: string; pdf: Uint8Array<ArrayBuffer> };

const roleLabels: Record<string, string> = {
  seller: "Vendedor",
  investor: "Comprador",
  advisor: "Asesor",
  admin: "Administrador",
};

function fullName(name: string, lastName: string | null): string {
  return [name, lastName ?? ""].map((part) => part.trim()).filter(Boolean).join(" ");
}

function validSignature(value: Uint8Array | null | undefined): Uint8Array | null {
  return value && jpegSize(value) ? Uint8Array.from(value) : null;
}

function reference(kind: SignedDocumentKind, id: string): string {
  const prefix = { nda: "NDA", advisor_nda: "NDA-A", loi: "LOI", terms: "TOS" }[kind];
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function documentKey(kind: SignedDocumentKind, refId: string): string {
  return `${kind}:${refId}`;
}

async function render(kind: SignedDocumentKind, refId: string): Promise<{ userId: string; pdf: Uint8Array<ArrayBuffer> } | null> {
  if (kind === "terms") {
    const user = await prisma.user.findUnique({
      where: { id: refId },
      select: { name: true, lastName: true, nationalId: true, role: true, termsAcceptedAt: true, signaturePng: true },
    });
    if (!user?.termsAcceptedAt) {
      return null;
    }
    const signer: DocumentSigner = { fullName: fullName(user.name, user.lastName), nationalId: user.nationalId, role: roleLabels[user.role ?? ""] ?? "Usuario" };
    const date = spanishDate(user.termsAcceptedAt);
    return {
      userId: refId,
      pdf: termsDocumentPdf({ signer, signature: validSignature(user.signaturePng), signedAt: date, dateLabel: date, reference: reference(kind, refId) }),
    };
  }

  if (kind === "advisor_nda") {
    const row = await prisma.advisoryEngagement.findUnique({
      where: { id: refId },
      select: {
        advisorNdaAcceptedAt: true,
        advisorNdaSignature: true,
        advisor: { select: { id: true, name: true, lastName: true, nationalId: true } },
        project: { select: { codename: true, region: true } },
      },
    });
    if (!row?.advisorNdaAcceptedAt || !row.advisor) {
      return null;
    }
    const name = fullName(row.advisor.name, row.advisor.lastName);
    const date = spanishDate(row.advisorNdaAcceptedAt);
    const text = advisorNdaAgreement({ advisorName: name, codename: row.project.codename, region: row.project.region, dateLabel: date });
    return {
      userId: row.advisor.id,
      pdf: dealDocumentPdf({
        kind,
        text,
        signer: { fullName: name, nationalId: row.advisor.nationalId, role: "Asesor" },
        signature: validSignature(row.advisorNdaSignature),
        signedAt: date,
        dateLabel: date,
        reference: reference(kind, refId),
      }),
    };
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: refId },
    select: {
      projectId: true,
      ndaAcceptedAt: true,
      ndaSignature: true,
      loiSignature: true,
      loiSignedAt: true,
      investor: { select: { id: true, name: true, lastName: true, nationalId: true } },
      project: { select: { codename: true, region: true } },
    },
  });
  if (!access) {
    return null;
  }
  const name = fullName(access.investor.name, access.investor.lastName);
  const signer: DocumentSigner = { fullName: name, nationalId: access.investor.nationalId, role: "Comprador" };

  if (kind === "nda") {
    if (!access.ndaAcceptedAt) {
      return null;
    }
    const date = spanishDate(access.ndaAcceptedAt);
    const text = ndaAgreement({ buyerName: name, codename: access.project.codename, region: access.project.region, dateLabel: date });
    return {
      userId: access.investor.id,
      pdf: dealDocumentPdf({ kind, text, signer, signature: validSignature(access.ndaSignature), signedAt: date, dateLabel: date, reference: reference(kind, refId) }),
    };
  }

  const offer = await prisma.projectMessage.findFirst({
    where: { projectId: access.projectId, investorId: access.investor.id, kind: "offer" },
    orderBy: { createdAt: "desc" },
    select: { body: true, createdAt: true },
  });
  if (!offer) {
    return null;
  }
  const date = spanishDate(access.loiSignedAt ?? offer.createdAt);
  return {
    userId: access.investor.id,
    pdf: dealDocumentPdf({
      kind: "loi",
      text: offer.body || loiAgreement({ buyerName: name, codename: access.project.codename, region: access.project.region, askingPrice: "", dateLabel: date }),
      signer,
      signature: validSignature(access.loiSignature),
      signedAt: date,
      dateLabel: date,
      reference: reference(kind, refId),
    }),
  };
}

/** Renders the PDF from the signed record and stores it. Called right after signing. */
export async function storeSignedDocument(kind: SignedDocumentKind, refId: string): Promise<StoredDocument | null> {
  const rendered = await render(kind, refId);
  if (!rendered) {
    return null;
  }
  const fileName = documentFileName(kind);
  const key = documentKey(kind, refId);
  await prisma.signedDocument.upsert({
    where: { key },
    create: { key, kind, userId: rendered.userId, fileName, pdf: rendered.pdf },
    update: { userId: rendered.userId, fileName, pdf: rendered.pdf },
  });
  return { fileName, pdf: rendered.pdf };
}

/** Stored PDF; documents signed before this table existed are rendered and stored on first read. */
/** PDFs stored by an older template are re-rendered once (signatures, seal). */
const TEMPLATE_MARK = "Relify signed-pdf v3";
function isCurrentTemplate(pdf: Uint8Array): boolean {
  return new TextDecoder("latin1").decode(pdf.subarray(Math.max(0, pdf.length - 4096))).includes(TEMPLATE_MARK);
}

export async function readSignedDocument(kind: SignedDocumentKind, refId: string): Promise<StoredDocument | null> {
  const stored = await prisma.signedDocument.findUnique({
    where: { key: documentKey(kind, refId) },
    select: { fileName: true, pdf: true },
  });
  if (stored && isCurrentTemplate(stored.pdf)) {
    return { fileName: stored.fileName, pdf: Uint8Array.from(stored.pdf) };
  }
  return storeSignedDocument(kind, refId);
}

/** Never let a PDF failure undo a signature that is already saved. */
export async function storeSignedDocumentQuietly(kind: SignedDocumentKind, refId: string): Promise<void> {
  try {
    await storeSignedDocument(kind, refId);
  } catch (error) {
    console.error("signed document", kind, error instanceof Error ? error.message : "unknown");
  }
}

export function pdfResponse(document: StoredDocument, download: boolean): Response {
  const disposition = download ? "attachment" : "inline";
  return new Response(new Uint8Array(document.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${document.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
