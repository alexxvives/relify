import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { successFeeFromClose } from "@/lib/billing";
import { formatEur } from "@/lib/money";
import {
  CONTRACT_MAX_BYTES,
  asContractStatus,
  contractCan,
  contractChangesMessage,
  contractCommentMax,
  contractNext,
  contractStage,
  isPdfBytes,
  type ContractParty,
  type ContractView,
} from "@/lib/sale-contract";
import { signedPdf } from "@/lib/signed-pdf";
import { signatureBytes, signatureJpeg } from "@/lib/signature-image";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification as notifyUser } from "@/server/recordNotification";

async function recordNotification(input: { userId: string | null; title: string; body: string; href: string | null }): Promise<void> {
  if (input.userId) await notifyUser({ ...input, userId: input.userId });
}

export type ContractResult = { ok: true; message: string } | { ok: false; message: string };

const fail = (message: string): ContractResult => ({ ok: false, message });

const accessSelect = {
  id: true,
  investorId: true,
  projectId: true,
  cancelledAt: true,
  loiAcceptedAt: true,
  diligencePassedAt: true,
  buyerPlanAtMatch: true,
  project: { select: { ownerId: true, codename: true, slug: true, successFee: { select: { id: true } } } },
} as const;

type AccessRow = NonNullable<Awaited<ReturnType<typeof loadAccess>>>;

function loadAccess(accessId: string) {
  return prisma.projectAccess.findUnique({ where: { id: accessId }, select: accessSelect });
}

async function partyFor(user: CurrentUser, access: AccessRow): Promise<ContractParty | null> {
  if (!user.onboarded || access.cancelledAt) return null;
  if (access.investorId === user.id) return "buyer";
  if (access.project.ownerId === user.id) return "seller";
  if (user.role !== "advisor") return null;
  const engagement = await prisma.advisoryEngagement.findFirst({
    where: { projectId: access.projectId, client: "seller", advisorId: user.id, depositPaidAt: { not: null }, declinedAt: null },
    select: { id: true },
  });
  return engagement ? "advisor" : null;
}

async function contractOpen(access: AccessRow): Promise<boolean> {
  if (!access.loiAcceptedAt || access.cancelledAt) return false;
  if (access.diligencePassedAt) return true;
  const grant = await prisma.dataRoomGrant.findFirst({
    where: { projectId: access.projectId, investorId: access.investorId },
    select: { id: true },
  });
  return grant !== null;
}

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" }).format(date);
}

function personName(name: string | null | undefined, lastName: string | null | undefined): string {
  return [name ?? "", lastName ?? ""].map((part) => part.trim()).filter(Boolean).join(" ");
}

/** Contract state for each access, as seen by `viewer`. Accesses not in the documents stage are omitted. */
export async function contractViews(
  rows: { accessId: string; party: ContractParty; open: boolean }[],
): Promise<Map<string, ContractView>> {
  const wanted = rows.filter((row) => row.open);
  const result = new Map<string, ContractView>();
  if (wanted.length === 0) return result;

  const versions = await prisma.saleContract.findMany({
    where: { accessId: { in: wanted.map((row) => row.accessId) } },
    orderBy: { version: "desc" },
    select: {
      id: true,
      accessId: true,
      version: true,
      fileName: true,
      createdAt: true,
      uploadedByRole: true,
      status: true,
      reviewComment: true,
      priceCents: true,
      buyerSignedAt: true,
      sellerSignedAt: true,
    },
  });

  for (const row of wanted) {
    const own = versions.filter((item) => item.accessId === row.accessId);
    const views = own.map((item) => ({
      id: item.id,
      version: item.version,
      fileName: item.fileName,
      uploadedAt: item.createdAt.toISOString(),
      uploadedBy: item.uploadedByRole === "advisor" ? "Asesor del vendedor" : "Vendedor",
      status: asContractStatus(item.status),
      comment: item.reviewComment,
      href: `/acuerdos/contrato/${item.id}`,
    }));
    const head = own[0];
    const currentView = views[0];
    const current =
      head && currentView
        ? {
            ...currentView,
            price: formatEur(head.priceCents),
            buyerSignedAt: head.buyerSignedAt?.toISOString() ?? null,
            sellerSignedAt: head.sellerSignedAt?.toISOString() ?? null,
          }
        : null;
    const stage = contractStage(current);
    const flags = { party: row.party, stage, buyerSigned: Boolean(current?.buyerSignedAt), sellerSigned: Boolean(current?.sellerSignedAt) };
    result.set(row.accessId, {
      accessId: row.accessId,
      party: row.party,
      stage,
      current,
      versions: views,
      signedHref: stage === "signed" && current ? `/acuerdos/contrato/${current.id}?firmado=1` : null,
      next: contractNext(flags),
      can: contractCan(flags),
    });
  }

  return result;
}

/** Whether an access is in (or past) the documents stage, for loaders that already hold the flags. */
export function contractStageOpen(input: { loiAccepted: boolean; passedDiligence: boolean; roomShared: boolean }): boolean {
  return input.loiAccepted && (input.passedDiligence || input.roomShared);
}

export async function uploadSaleContract(
  user: CurrentUser,
  input: { accessId: string; priceCents: number; fileName: string },
  bytes: Uint8Array,
): Promise<ContractResult> {
  const access = await loadAccess(input.accessId);
  const party = access ? await partyFor(user, access) : null;

  if (!access || (party !== "seller" && party !== "advisor")) return fail("No puedes subir el contrato de este proceso.");
  if (!(await contractOpen(access))) return fail("El contrato se sube después de la due diligence.");
  if (bytes.byteLength === 0 || bytes.byteLength > CONTRACT_MAX_BYTES) return fail("El PDF debe pesar menos de 7 MB.");
  if (!isPdfBytes(bytes)) return fail("El archivo tiene que ser un PDF.");
  if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) return fail("Indica el precio final de la compraventa.");

  const latest = await prisma.saleContract.findFirst({ where: { accessId: access.id }, orderBy: { version: "desc" }, select: { id: true, version: true, status: true } });

  if (latest && (latest.status === "accepted" || latest.status === "signed")) {
    return fail("El comprador ya aceptó este contrato. No se pueden subir versiones nuevas.");
  }

  const version = (latest?.version ?? 0) + 1;
  const fileName = input.fileName.trim().replace(/[\\/"\r\n]+/g, "_").slice(0, 160) || `contrato-v${version}.pdf`;

  await prisma.$transaction([
    ...(latest ? [prisma.saleContract.update({ where: { id: latest.id }, data: { status: "superseded" } })] : []),
    prisma.saleContract.create({
      data: {
        id: randomUUID(),
        accessId: access.id,
        version,
        fileName: fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`,
        pdf: Uint8Array.from(bytes),
        priceCents: input.priceCents,
        uploadedById: user.id,
        uploadedByRole: party,
        status: "review",
      },
    }),
  ]);

  await recordNotification({
    userId: access.investorId,
    title: version === 1 ? "Contrato de compraventa disponible" : "Nueva versión del contrato",
    body: `${access.project.codename}: revisa el contrato (versión ${version}) y acéptalo o pide cambios.`,
    href: "/procesos",
  });

  return { ok: true, message: version === 1 ? "Contrato subido. El comprador ya puede revisarlo." : `Versión ${version} subida.` };
}

export async function reviewSaleContract(
  user: CurrentUser,
  input: { contractId: string; decision: "accept" | "changes"; comment: string },
): Promise<ContractResult> {
  const contract = await prisma.saleContract.findUnique({ where: { id: input.contractId }, select: { id: true, accessId: true, version: true, status: true } });
  const access = contract ? await loadAccess(contract.accessId) : null;
  const party = access ? await partyFor(user, access) : null;

  if (!contract || !access || party !== "buyer") return fail("No puedes revisar este contrato.");
  if (contract.status !== "review") return fail("Este contrato ya no está pendiente de revisión.");

  const comment = input.comment.trim().slice(0, contractCommentMax);

  if (input.decision === "changes") {
    if (comment.length < 3) return fail("Explica qué cambios necesitas.");
    await prisma.$transaction([
      prisma.saleContract.update({ where: { id: contract.id }, data: { status: "changes", reviewComment: comment, reviewedAt: new Date() } }),
      prisma.projectMessage.create({
        data: {
          id: randomUUID(),
          projectId: access.projectId,
          investorId: access.investorId,
          author: "investor",
          kind: "question",
          body: contractChangesMessage(contract.version, comment),
        },
      }),
    ]);
    await recordNotification({
      userId: access.project.ownerId,
      title: "El comprador pide cambios en el contrato",
      body: `${access.project.codename}: lee el comentario en el chat y sube una versión nueva.`,
      href: "/mi-empresa/procesos",
    });
    return { ok: true, message: "Hemos enviado tus cambios al vendedor." };
  }

  await prisma.saleContract.update({ where: { id: contract.id }, data: { status: "accepted", reviewComment: comment || null, reviewedAt: new Date() } });
  await recordNotification({
    userId: access.project.ownerId,
    title: "Contrato aceptado: falta firmar",
    body: `${access.project.codename}: el comprador ha aceptado el contrato. Fírmalo para cerrar la venta.`,
    href: "/mi-empresa/procesos",
  });
  return { ok: true, message: "Contrato aceptado. Ya podéis firmarlo." };
}

export async function signSaleContract(user: CurrentUser, contractId: string, signatureValue: unknown): Promise<ContractResult> {
  const contract = await prisma.saleContract.findUnique({
    where: { id: contractId },
    select: { id: true, accessId: true, status: true, buyerSignedAt: true, sellerSignedAt: true },
  });
  const access = contract ? await loadAccess(contract.accessId) : null;
  const party = access ? await partyFor(user, access) : null;

  if (!contract || !access || (party !== "buyer" && party !== "seller")) return fail("No puedes firmar este contrato.");
  if (contract.status !== "accepted") return fail("Este contrato no está listo para firmar.");
  if ((party === "buyer" && contract.buyerSignedAt) || (party === "seller" && contract.sellerSignedAt)) return fail("Ya has firmado este contrato.");

  const signature = signatureJpeg(signatureValue);
  if (!signature) return fail("Dibuja tu firma para continuar.");

  const now = new Date();
  await clearContractNotices([user.id], access.project.codename);
  const updated = await prisma.saleContract.update({
    where: { id: contract.id },
    data: party === "buyer" ? { buyerSignature: signatureBytes(signature), buyerSignedAt: now } : { sellerSignature: signatureBytes(signature), sellerSignedAt: now },
    select: { buyerSignedAt: true, sellerSignedAt: true },
  });

  if (!updated.buyerSignedAt || !updated.sellerSignedAt) {
    await recordNotification({
      userId: party === "buyer" ? access.project.ownerId : access.investorId,
      title: "Falta tu firma en el contrato",
      body: `${access.project.codename}: la otra parte ya ha firmado el contrato de compraventa.`,
      href: party === "buyer" ? "/mi-empresa/procesos" : "/procesos",
    });
    return { ok: true, message: "Firma guardada. Falta la firma de la otra parte." };
  }

  // Both signed: lock the version, store the signed PDF and record the closing fee.
  const claimed = await prisma.saleContract.updateMany({ where: { id: contract.id, status: "accepted" }, data: { status: "signed" } });
  if (claimed.count === 0) return { ok: true, message: "Contrato firmado." };

  await storeSignedContract(contract.id).catch((error: unknown) => {
    console.error("signed contract", error instanceof Error ? error.message : "unknown");
  });
  await closeDeal(access, contract.id);
  await clearContractNotices([access.investorId, access.project.ownerId], access.project.codename);

  for (const [userId, href] of [
    [access.investorId, "/procesos"],
    [access.project.ownerId, "/mi-empresa/procesos"],
  ] as const) {
    await recordNotification({
      userId,
      title: "Compraventa cerrada",
      body: `${access.project.codename}: el contrato está firmado por las dos partes.`,
      href,
    });
  }

  return { ok: true, message: "Contrato firmado por las dos partes. ¡Compraventa cerrada!" };
}

const contractActionTitles = [
  "Contrato de compraventa disponible",
  "Nueva versión del contrato",
  "El comprador pide cambios en el contrato",
  "Contrato aceptado: falta firmar",
  "Falta tu firma en el contrato",
];

/** Contract to-dos are done once the user signs (or the deal closes): mark them read. */
async function clearContractNotices(userIds: Array<string | null>, codename: string): Promise<void> {
  const ids = userIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  await prisma.notification
    .updateMany({
      where: { userId: { in: ids }, readAt: null, title: { in: contractActionTitles }, body: { startsWith: `${codename}:` } },
      data: { readAt: new Date() },
    })
    .catch(() => undefined);
}

async function closeDeal(access: AccessRow, contractId: string): Promise<void> {
  if (access.project.successFee) return;
  const row = await prisma.saleContract.findUnique({ where: { id: contractId }, select: { priceCents: true } });
  if (!row) return;
  const fee = successFeeFromClose(row.priceCents, access.buyerPlanAtMatch ?? null);
  await prisma.successFee
    .create({
      data: {
        id: randomUUID(),
        projectId: access.projectId,
        closedPriceCents: row.priceCents,
        buyerNetCents: fee.buyerNetCents,
        buyerVatCents: fee.buyerVatCents,
        sellerNetCents: fee.sellerNetCents,
        sellerVatCents: fee.sellerVatCents,
      },
    })
    .catch(() => undefined); // unique projectId: a concurrent close already recorded it
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Original contract pages followed by a signature sheet with both drawn signatures. */
export async function renderSignedContract(contractId: string): Promise<{ fileName: string; pdf: Uint8Array<ArrayBuffer> } | null> {
  const row = await prisma.saleContract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      version: true,
      fileName: true,
      pdf: true,
      priceCents: true,
      buyerSignature: true,
      buyerSignedAt: true,
      sellerSignature: true,
      sellerSignedAt: true,
      access: {
        select: {
          investor: { select: { name: true, lastName: true, email: true } },
          project: { select: { codename: true, owner: { select: { name: true, lastName: true, email: true } } } },
        },
      },
    },
  });

  if (!row || !row.buyerSignedAt || !row.sellerSignedAt) return null;

  const buyer = row.access.investor;
  const seller = row.access.project.owner;
  const hash = await sha256Hex(row.pdf);
  const reference = `CV-${row.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const sheet = signedPdf({
    title: "Contrato de compraventa · Hoja de firmas",
    reference,
    dateLabel: dateLabel(row.sellerSignedAt > row.buyerSignedAt ? row.sellerSignedAt : row.buyerSignedAt),
    parties: [
      { role: "Vendedor", name: personName(seller?.name, seller?.lastName) || "Vendedor", lines: seller?.email ? [seller.email] : [] },
      { role: "Comprador", name: personName(buyer.name, buyer.lastName) || "Comprador", lines: buyer.email ? [buyer.email] : [] },
    ],
    intro: `Las partes firman el contrato de compraventa de ${row.access.project.codename} adjunto en las páginas anteriores.`,
    clauses: [
      `Documento firmado: ${row.fileName} (versión ${row.version}).`,
      `Huella SHA-256 del contrato: ${hash}.`,
      `Precio final de la compraventa: ${formatEur(row.priceCents)}.`,
      "Ambas partes aceptaron esta versión del contrato en Relify y la firmaron con firma manuscrita digital. Esta hoja forma parte inseparable del contrato.",
    ],
    signers: [
      { role: "Vendedor", name: personName(seller?.name, seller?.lastName) || "Vendedor", idLine: seller?.email ?? "", signature: row.sellerSignature ? Uint8Array.from(row.sellerSignature) : null, signedAt: dateLabel(row.sellerSignedAt) },
      { role: "Comprador", name: personName(buyer.name, buyer.lastName) || "Comprador", idLine: buyer.email ?? "", signature: row.buyerSignature ? Uint8Array.from(row.buyerSignature) : null, signedAt: dateLabel(row.buyerSignedAt) },
    ],
    note: "Firmado electrónicamente en Relify. La huella SHA-256 identifica la versión exacta del contrato firmado.",
  });

  const base = row.fileName.replace(/\.pdf$/i, "");
  const fileName = `${base}-firmado.pdf`;

  try {
    const merged = await PDFDocument.create();
    const original = await PDFDocument.load(Uint8Array.from(row.pdf), { ignoreEncryption: true });
    for (const page of await merged.copyPages(original, original.getPageIndices())) merged.addPage(page);
    const signatures = await PDFDocument.load(sheet);
    for (const page of await merged.copyPages(signatures, signatures.getPageIndices())) merged.addPage(page);
    merged.setTitle(`Contrato de compraventa ${row.access.project.codename} (firmado)`);
    return { fileName, pdf: Uint8Array.from(await merged.save()) };
  } catch {
    // Unreadable source PDF: keep the signature sheet alone (it carries the contract hash).
    return { fileName, pdf: sheet };
  }
}

async function storeSignedContract(contractId: string): Promise<void> {
  const rendered = await renderSignedContract(contractId);
  if (!rendered) return;
  const owner = await prisma.saleContract.findUnique({ where: { id: contractId }, select: { access: { select: { investorId: true } } } });
  await prisma.signedDocument.upsert({
    where: { key: `contract:${contractId}` },
    create: { key: `contract:${contractId}`, kind: "contract", userId: owner?.access.investorId ?? "", fileName: rendered.fileName, pdf: rendered.pdf },
    update: { fileName: rendered.fileName, pdf: rendered.pdf },
  });
}

/** PDF bytes for the contract route: the uploaded version, or the signed copy. */
export async function readContractFile(
  user: CurrentUser,
  contractId: string,
  signed: boolean,
): Promise<{ fileName: string; pdf: Uint8Array<ArrayBuffer> } | null> {
  const row = await prisma.saleContract.findUnique({ where: { id: contractId }, select: { accessId: true, fileName: true, status: true } });
  const access = row ? await loadAccess(row.accessId) : null;
  const party = access ? await partyFor(user, access) : null;

  if (!row || !party) return null;

  if (!signed) {
    const file = await prisma.saleContract.findUnique({ where: { id: contractId }, select: { pdf: true } });
    return file ? { fileName: row.fileName, pdf: Uint8Array.from(file.pdf) } : null;
  }

  if (row.status !== "signed") return null;
  const stored = await prisma.signedDocument.findUnique({ where: { key: `contract:${contractId}` }, select: { fileName: true, pdf: true } });
  if (stored) return { fileName: stored.fileName, pdf: Uint8Array.from(stored.pdf) };
  await storeSignedContract(contractId);
  return renderSignedContract(contractId);
}
