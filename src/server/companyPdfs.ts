import { randomBytes, randomUUID } from "node:crypto";
import { ndaAccessGate } from "@/lib/project-access";
import {
  buildCompanyPdf,
  companyPdfFileName,
  dossierViewFromInvestor,
  teaserViewFromPublic,
  type CompanyPdfKind,
} from "@/lib/company-pdf";
import { spanishDate, signerName } from "@/lib/deal-documents";
import { isHeadcountRange } from "@/lib/company-profile";
import { readSiteUrl } from "@/lib/env";
import { getInvestorProject } from "@/server/getInvestorProject";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { pdfResponse } from "@/server/signedDocuments";

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
  cnaes: { select: { code: true }, orderBy: { position: "asc" as const }, take: 1 },
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
  cnaes: { code: string }[];
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
    revenueCents: Number(row.revenueCents),
    ebitdaCents: Number(row.ebitdaCents),
    adjustedEbitdaCents: Number(row.adjustedEbitdaCents),
    askingPriceCents: Number(row.askingPriceCents),
    ebitdaAdjustments: row.ebitdaAdjustments,
    generatedLabel,
  });
}

async function pdfFor(view: ReturnType<typeof teaserView>, download: boolean): Promise<Response> {
  const pdf = await buildCompanyPdf(view);
  return pdfResponse({ pdf, fileName: companyPdfFileName(view.kind, view.codename) }, download);
}

export async function sellerTeaserShareUrl(userId: string): Promise<string | null> {
  const projectId = await activeSellerProjectId(userId);
  if (!projectId) {
    return null;
  }
  const row = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId, status: "published" },
    select: { id: true, teaserToken: true },
  });
  if (!row) {
    return null;
  }
  const token = await ensureTeaserToken(row.id, row.teaserToken);
  return new URL(`/t/${token}`, readSiteUrl()).href;
}

export async function sellerTeaserPdf(user: CurrentUser, download: boolean): Promise<Response | null> {
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
  await logDownload(row.id, "teaser", user.id);
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
