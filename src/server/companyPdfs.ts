import { randomBytes, randomUUID } from "node:crypto";
import { ndaAccessGate } from "@/lib/project-access";
import {
  buildCompanyPdf,
  companyPdfFileName,
  dossierViewFromInvestor,
  sabiYearsFromTeaserRows,
  teaserViewFromPublic,
  type CompanyPdfKind,
} from "@/lib/company-pdf";
import type { SellerTeaserDesk } from "@/lib/company-pdf-copy";
import { spanishDate, signerName } from "@/lib/deal-documents";
import { isHeadcountRange } from "@/lib/company-profile";
import { formatWholeEur } from "@/lib/money";
import { sellerFinancingText, storedSellerFinancing } from "@/lib/seller-financing";
import { sellerStayText, storedSellerStay } from "@/lib/seller-stay";
import { buildLoiTemplatePdf, loiTemplateFileName } from "@/lib/loi-template-pdf";
import { readSiteUrl } from "@/lib/env";
import { getInvestorProject } from "@/server/getInvestorProject";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { pdfResponse } from "@/server/signedDocuments";

export type { SellerTeaserDesk };

const teaserTokenSchema = /^[A-Za-z0-9_-]{16,64}$/;

const teaserSelect = {
  id: true,
  slug: true,
  status: true,
  ownerId: true,
  teaserToken: true,
  codename: true,
  region: true,
  foundedYear: true,
  description: true,
  headcountRange: true,
  revenueCents: true,
  ebitdaCents: true,
  adjustedEbitdaCents: true,
  askingPriceCents: true,
  ebitdaAdjustments: true,
  saleReason: true,
  sellerFinancing: true,
  sellerFinancingMaxPct: true,
  sellerFinancingYears: true,
  sellerStay: true,
  cnaes: { select: { code: true }, orderBy: { position: "asc" as const }, take: 1 },
  years: {
    where: { kind: "closed" as const },
    orderBy: { year: "asc" as const },
    take: 4,
    select: {
      year: true,
      months: true,
      employees: true,
      salesCents: true,
      ebitdaCents: true,
    },
  },
} as const;

type TeaserRow = {
  id: string;
  slug: string;
  status: "draft" | "pending" | "published";
  ownerId: string | null;
  teaserToken: string | null;
  codename: string;
  region: string;
  foundedYear: number | null;
  description: string | null;
  headcountRange: string | null;
  revenueCents: bigint | number;
  ebitdaCents: bigint | number;
  adjustedEbitdaCents: bigint | number;
  askingPriceCents: bigint | number;
  ebitdaAdjustments: unknown;
  saleReason: string | null;
  sellerFinancing: string | null;
  sellerFinancingMaxPct: number | null;
  sellerFinancingYears: number | null;
  sellerStay: string | null;
  cnaes: { code: string }[];
  years: Array<{
    year: number;
    months: number | null;
    employees: number | null;
    salesCents: bigint | number | null;
    ebitdaCents: bigint | number | null;
  }>;
};

async function logDownload(projectId: string, kind: CompanyPdfKind, userId: string | null): Promise<void> {
  await prisma.pdfDownload.create({
    data: {
      id: randomUUID(),
      projectId,
      userId,
      kind,
    },
  });
}

async function ensureTeaserToken(projectId: string, current: string | null): Promise<string> {
  if (current) {
    return current;
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const token = randomBytes(18).toString("base64url");
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: { teaserToken: token },
      });
      return token;
    } catch {
      continue;
    }
  }
  throw new Error("teaser token");
}

function teaserView(row: TeaserRow, generatedLabel: string) {
  const headcount = row.headcountRange && isHeadcountRange(row.headcountRange) ? row.headcountRange : null;
  return teaserViewFromPublic({
    codename: row.codename,
    region: row.region,
    cnaeCode: row.cnaes[0]?.code ?? null,
    foundedYear: row.foundedYear,
    headcount,
    summary: row.description,
    saleReason: row.saleReason,
    sellerFinancing: storedSellerFinancing(row),
    sellerStay: storedSellerStay(row.sellerStay),
    revenueCents: Number(row.revenueCents),
    ebitdaCents: Number(row.ebitdaCents),
    adjustedEbitdaCents: Number(row.adjustedEbitdaCents),
    askingPriceCents: Number(row.askingPriceCents),
    ebitdaAdjustments: row.ebitdaAdjustments,
    reportYears: sabiYearsFromTeaserRows(row.years),
    generatedLabel,
  });
}

async function pdfFor(view: ReturnType<typeof teaserView>, download: boolean): Promise<Response> {
  const pdf = await buildCompanyPdf(view);
  return pdfResponse({ pdf, fileName: companyPdfFileName(view.kind, view.codename) }, download);
}

function shareHref(token: string): string {
  return new URL(`/t/${token}`, readSiteUrl()).href;
}

async function teaserDeskForProject(projectId: string, status: string, token: string | null): Promise<SellerTeaserDesk> {
  const nextToken = await ensureTeaserToken(projectId, token);
  const downloads = await prisma.pdfDownload.count({
    where: { projectId, kind: "teaser" },
  });
  return {
    published: status === "published",
    shareUrl: shareHref(nextToken),
    downloads,
  };
}

export async function sellerTeaserDesk(userId: string): Promise<SellerTeaserDesk | null> {
  const projectId = await activeSellerProjectId(userId);
  if (!projectId) {
    return null;
  }
  const row = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true, status: true, teaserToken: true },
  });
  if (!row) {
    return null;
  }
  return teaserDeskForProject(row.id, row.status, row.teaserToken);
}

export async function adminTeaserDesk(slug: string): Promise<SellerTeaserDesk | null> {
  const row = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, status: true, teaserToken: true },
  });
  if (!row) {
    return null;
  }
  return teaserDeskForProject(row.id, row.status, row.teaserToken);
}

export async function rotateAdminTeaserToken(
  user: CurrentUser,
  slug: string,
): Promise<{ ok: true; shareUrl: string } | { ok: false; message: string }> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: "No hay ficha." };
  }
  const row = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!row) {
    return { ok: false, message: "No hay ficha." };
  }
  return rotateTeaserToken(user, row.id);
}

export async function rotateTeaserToken(
  user: CurrentUser,
  projectId?: string,
): Promise<{ ok: true; shareUrl: string } | { ok: false; message: string }> {
  const owned =
    user.role === "seller"
      ? await activeSellerProjectId(user.id)
      : null;
  const id = user.role === "admin" ? projectId : owned;
  if (!id) {
    return { ok: false, message: "No hay ficha." };
  }
  const row = await prisma.project.findFirst({
    where: user.role === "admin" ? { id } : { id, ownerId: user.id },
    select: { id: true },
  });
  if (!row) {
    return { ok: false, message: "No hay ficha." };
  }
  const token = await ensureTeaserToken(row.id, null);
  return { ok: true, shareUrl: shareHref(token) };
}

export async function sellerTeaserPdf(
  user: CurrentUser,
  download: boolean,
  options: { log?: boolean } = {},
): Promise<Response | null> {
  if (!user.onboarded || user.role !== "seller") {
    return null;
  }
  const projectId = await activeSellerProjectId(user.id);
  if (!projectId) {
    return null;
  }
  const row = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: teaserSelect,
  });
  if (!row) {
    return null;
  }
  await ensureTeaserToken(row.id, row.teaserToken);
  if (options.log ?? download) {
    await logDownload(row.id, "teaser", user.id);
  }
  return pdfFor(teaserView(row, spanishDate(new Date())), download);
}

export async function adminTeaserPdf(
  user: CurrentUser,
  slug: string,
  download: boolean,
  options: { log?: boolean } = {},
): Promise<Response | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }
  const row = await prisma.project.findUnique({
    where: { slug },
    select: teaserSelect,
  });
  if (!row) {
    return null;
  }
  await ensureTeaserToken(row.id, row.teaserToken);
  if (options.log ?? download) {
    await logDownload(row.id, "teaser", user.id);
  }
  return pdfFor(teaserView(row, spanishDate(new Date())), download);
}

export async function publicTeaserPdf(token: string, download: boolean): Promise<Response | null> {
  if (!teaserTokenSchema.test(token)) {
    return null;
  }
  const row = await prisma.project.findFirst({
    where: { teaserToken: token, status: "published" },
    select: teaserSelect,
  });
  if (!row) {
    return null;
  }
  await logDownload(row.id, "teaser", null);
  return pdfFor(teaserView(row, spanishDate(new Date())), download);
}

export async function buyerDossierPdf(
  user: CurrentUser,
  slug: string,
  download: boolean,
): Promise<Response | null> {
  if (!user.onboarded || user.role !== "investor") {
    return null;
  }
  const access = await prisma.projectAccess.findFirst({
    where: {
      investorId: user.id,
      cancelledAt: null,
      project: { slug, status: "published" },
    },
    select: {
      ndaAcceptedAt: true,
      project: { select: { id: true, status: true } },
    },
  });
  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: access?.project.status ?? null,
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
  });
  if (!gate.ok || !access) {
    return null;
  }
  const project = await getInvestorProject(user, slug);
  if (!project) {
    return null;
  }
  const watermark = `${signerName(user.name, user.lastName)} · ${user.email} · ${spanishDate(new Date())}`;
  const view = dossierViewFromInvestor({
    ...project,
    generatedLabel: spanishDate(new Date()),
    watermark,
  });
  await logDownload(access.project.id, "dossier", user.id);
  const pdf = await buildCompanyPdf(view);
  return pdfResponse({ pdf, fileName: companyPdfFileName("dossier", project.codename) }, download);
}

export async function dealLoiTemplatePdf(
  user: CurrentUser,
  accessId: string,
  download: boolean,
): Promise<Response | null> {
  if (!user.onboarded) {
    return null;
  }
  const access = await prisma.projectAccess.findFirst({
    where: { id: accessId, cancelledAt: null },
    select: {
      investorId: true,
      ndaAcceptedAt: true,
      investor: { select: { name: true, lastName: true } },
      project: {
        select: {
          ownerId: true,
          status: true,
          codename: true,
          region: true,
          askingPriceCents: true,
          sellerFinancing: true,
          sellerFinancingMaxPct: true,
          sellerFinancingYears: true,
          sellerStay: true,
        },
      },
    },
  });
  if (!access || (access.investorId !== user.id && access.project.ownerId !== user.id)) {
    return null;
  }
  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: access.investorId === user.id ? "investor" : "seller",
    projectStatus: access.project.status,
    ndaAcceptedAt: access.ndaAcceptedAt,
  });
  if (!gate.ok) {
    return null;
  }
  const financing = storedSellerFinancing(access.project);
  const stay = storedSellerStay(access.project.sellerStay);
  const structure = [
    "Compraventa de participaciones de la sociedad titular del proyecto.",
    financing ? `Financiación vendedor: ${sellerFinancingText(financing)}.` : null,
    stay ? `Permanencia: ${sellerStayText(stay)}.` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const pdf = await buildLoiTemplatePdf({
    buyerName: signerName(access.investor.name, access.investor.lastName),
    codename: access.project.codename,
    region: access.project.region,
    askingPrice: formatWholeEur(Number(access.project.askingPriceCents)),
    structure,
    dateLabel: spanishDate(new Date()),
  });
  return pdfResponse({ pdf, fileName: loiTemplateFileName(access.project.codename) }, download);
}
