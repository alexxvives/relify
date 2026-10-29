import { randomUUID } from "node:crypto";
import { isCnaeCode } from "@/lib/cnae-2009";
import { statementEbitda, type PnlAmounts } from "@/lib/company-profile";
import {
  confirmFilingSchema,
  emptyExtraction,
  filingAmountKeys,
  filingByteLimit,
  filingKind,
  filingMimeTypes,
  filingYears,
  storedCents,
  type FilingAmountKey,
  type FilingExtraction,
  type FilingKind,
  type FilingStatus,
} from "@/lib/financial-filing";
import type { Prisma } from "@/generated/prisma/client";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { extractFiling } from "@/server/financialExtraction";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type FilingSummary = {
  year: number;
  kind: FilingKind;
  fileName: string;
  sizeBytes: number;
  status: FilingStatus;
  errorCode: string | null;
  extraction: FilingExtraction | null;
  confirmedAt: string | null;
  updatedAt: string;
};

export type FilingFailure = "forbidden" | "year" | "empty" | "too-large" | "type" | "unreadable" | "no-data" | "invalid" | "missing";
export type FilingResult<T> = ({ ok: true } & T) | { ok: false; code: FilingFailure };

async function ownedProjectId(user: CurrentUser): Promise<string | null> {
  if (!user.onboarded || user.role !== "seller") {
    return null;
  }

  const activeId = await activeSellerProjectId(user.id);

  if (!activeId) {
    return null;
  }

  const project = await prisma.project.findFirst({ where: { id: activeId, ownerId: user.id }, select: { id: true } });
  return project?.id ?? null;
}

const summarySelect = {
  year: true,
  kind: true,
  fileName: true,
  sizeBytes: true,
  status: true,
  errorCode: true,
  extracted: true,
  confirmedAt: true,
  updatedAt: true,
} as const;

function toSummary(row: {
  year: number;
  kind: string;
  fileName: string;
  sizeBytes: number;
  status: string;
  errorCode: string | null;
  extracted: unknown;
  confirmedAt: Date | null;
  updatedAt: Date;
}): FilingSummary {
  return {
    year: row.year,
    kind: row.kind as FilingKind,
    fileName: row.fileName,
    sizeBytes: row.sizeBytes,
    status: row.status as FilingStatus,
    errorCode: row.errorCode,
    extraction: (row.extracted as FilingExtraction | null) ?? null,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFilings(user: CurrentUser): Promise<{ projectId: string; years: number[]; filings: FilingSummary[] } | null> {
  const projectId = await ownedProjectId(user);

  if (!projectId) {
    return null;
  }

  const rows = await prisma.financialFiling.findMany({ where: { projectId }, select: summarySelect, orderBy: { year: "desc" } });
  return { projectId, years: filingYears(new Date()), filings: rows.map(toSummary) };
}

export async function uploadFiling(
  user: CurrentUser,
  year: number,
  bytes: Uint8Array,
  fileName: string,
): Promise<FilingResult<{ filing: FilingSummary }>> {
  const projectId = await ownedProjectId(user);

  if (!projectId) {
    return { ok: false, code: "forbidden" };
  }

  if (!filingYears(new Date()).includes(year)) {
    return { ok: false, code: "year" };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, code: "empty" };
  }

  if (bytes.byteLength > filingByteLimit) {
    return { ok: false, code: "too-large" };
  }

  const kind = filingKind(bytes, fileName);

  if (!kind) {
    return { ok: false, code: "type" };
  }

  const safeName = fileName.replace(/[\u0000-\u001f\\/]/g, "_").slice(0, 160) || `modelo-200-${year}.pdf`;
  const data = {
    kind,
    fileName: safeName,
    mimeType: filingMimeTypes[kind],
    sizeBytes: bytes.byteLength,
    bytes: new Uint8Array(bytes),
    status: "uploaded",
    errorCode: null,
    confirmedAt: null,
    uploadedById: user.id,
  };
  await prisma.financialFiling.upsert({
    where: { projectId_year: { projectId, year } },
    create: { id: randomUUID(), projectId, year, ...data },
    update: data,
  });

  const result = await extractFiling(kind, bytes, safeName, year);
  const row = await prisma.financialFiling.update({
    where: { projectId_year: { projectId, year } },
    data: result.ok
      ? { status: "extracted", errorCode: null, extracted: result.extraction as unknown as Prisma.InputJsonValue }
      : { status: "failed", errorCode: result.code, extracted: emptyExtraction() as unknown as Prisma.InputJsonValue },
    select: summarySelect,
  });

  return { ok: true, filing: toSummary(row) };
}

export async function deleteFiling(user: CurrentUser, year: number): Promise<FilingResult<object>> {
  const projectId = await ownedProjectId(user);

  if (!projectId) {
    return { ok: false, code: "forbidden" };
  }

  await prisma.financialFiling.deleteMany({ where: { projectId, year } });
  return { ok: true };
}

export async function confirmFiling(user: CurrentUser, raw: unknown): Promise<FilingResult<{ filing: FilingSummary }>> {
  const projectId = await ownedProjectId(user);

  if (!projectId) {
    return { ok: false, code: "forbidden" };
  }

  const parsed = confirmFilingSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  const input = parsed.data;
  const filing = await prisma.financialFiling.findUnique({
    where: { projectId_year: { projectId, year: input.year } },
    select: { id: true, extracted: true },
  });

  if (!filing) {
    return { ok: false, code: "missing" };
  }

  const previous = (filing.extracted as FilingExtraction | null) ?? emptyExtraction();
  const confirmed: FilingExtraction = {
    ...previous,
    amounts: Object.fromEntries(
      filingAmountKeys.map((key) => {
        const value = input.amounts[key];
        const before = previous.amounts[key];
        const same = before && before.value === value;
        return [key, { value, confidence: same ? before.confidence : "alta" }];
      }),
    ),
    cnae: { value: input.cnae || null, confidence: "alta" },
    averageHeadcount: { value: input.averageHeadcount, confidence: "alta" },
  };
  const cents = Object.fromEntries(filingAmountKeys.map((key) => [key, storedCents(key, input.amounts[key])])) as Record<
    FilingAmountKey,
    number | null
  >;
  const now = new Date();

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.projectYear.findUnique({ where: { projectId_year: { projectId, year: input.year } } });
    const detail: PnlAmounts = {
      sales: cents.sales,
      inventoryChange: existing?.inventoryChangeCents ?? null,
      ownUse: existing?.ownUseCents ?? null,
      supplies: cents.supplies,
      otherOperatingIncome: existing?.otherOperatingIncomeCents ?? null,
      staffCosts: cents.staffCosts,
      otherOperatingCosts: null,
      grantIncome: existing?.grantIncomeCents ?? null,
      provisionSurplus: existing?.provisionSurplusCents ?? null,
      assetImpairment: existing?.assetImpairmentCents ?? null,
      subsidiaryControlLoss: existing?.subsidiaryControlLossCents ?? null,
      negativeDifference: existing?.negativeDifferenceCents ?? null,
      otherResults: existing?.otherResultsCents ?? null,
      amortization: cents.amortization,
    };
    // Whatever the form does not break down goes to "otros gastos de explotación", so EBITDA
    // and the resultado de explotación in the charts match the declared figures.
    let otherOperatingCosts = existing?.otherOperatingCostsCents ?? null;
    const residual = cents.operatingResult !== null && cents.amortization !== null;

    if (residual) {
      const known = Object.entries(detail)
        .filter(([key]) => key !== "amortization" && key !== "otherOperatingCosts")
        .reduce((sum, [, value]) => sum + (value ?? 0), 0);
      otherOperatingCosts = (cents.operatingResult ?? 0) - (cents.amortization ?? 0) - known;
    }

    const yearData = {
      salesCents: cents.sales,
      suppliesCents: cents.supplies,
      staffCostsCents: cents.staffCosts,
      amortizationCents: cents.amortization,
      otherOperatingCostsCents: otherOperatingCosts,
      // With the residual in place, lines the Modelo 200 does not break down count as zero so the
      // ficha can show margen bruto, EBITDA and resultado de explotación.
      ...(residual
        ? {
            inventoryChangeCents: detail.inventoryChange ?? 0,
            ownUseCents: detail.ownUse ?? 0,
            otherOperatingIncomeCents: detail.otherOperatingIncome ?? 0,
            grantIncomeCents: detail.grantIncome ?? 0,
            provisionSurplusCents: detail.provisionSurplus ?? 0,
            assetImpairmentCents: detail.assetImpairment ?? 0,
            subsidiaryControlLossCents: detail.subsidiaryControlLoss ?? 0,
            negativeDifferenceCents: detail.negativeDifference ?? 0,
            otherResultsCents: detail.otherResults ?? 0,
          }
        : {}),
      financialResultCents: cents.financialResult,
      profitBeforeTaxCents: cents.profitBeforeTax,
      netResultCents: cents.netResult,
      nonCurrentAssetsCents: cents.nonCurrentAssets,
      currentAssetsCents: cents.currentAssets,
      inventoryCents: cents.inventory,
      receivablesCents: cents.receivables,
      cashCents: cents.cash,
      equityCents: cents.equity,
      longTermDebtCents: cents.longTermDebt,
      shortTermDebtCents: cents.shortTermDebt,
      suppliersCents: cents.suppliers,
      dataSource: "vendedor",
      confirmedAt: now,
    };

    await tx.projectYear.upsert({
      where: { projectId_year: { projectId, year: input.year } },
      create: { id: randomUUID(), projectId, year: input.year, kind: "closed", ...yearData },
      update: { kind: "closed", ...yearData },
    });

    const latest = await tx.projectYear.findFirst({
      where: { projectId, kind: "closed", dataSource: "vendedor" },
      orderBy: { year: "desc" },
      select: { year: true },
    });

    if (latest?.year === input.year) {
      const ebitda = statementEbitda({ ...detail, otherOperatingCosts });
      await tx.project.update({
        where: { id: projectId },
        data: {
          ...(cents.sales !== null ? { revenueCents: cents.sales } : {}),
          ...(ebitda !== null ? { ebitdaCents: ebitda } : {}),
          ...(cents.netResult !== null ? { netIncomeCents: cents.netResult } : {}),
          ...(input.averageHeadcount !== null ? { averageHeadcount: input.averageHeadcount } : {}),
        },
      });
    }

    if (input.cnae && isCnaeCode(input.cnae)) {
      const hasCnae = await tx.projectCnae.count({ where: { projectId } });

      if (hasCnae === 0) {
        await tx.projectCnae.create({ data: { id: randomUUID(), projectId, code: input.cnae, role: "principal", position: 0 } });
      }
    }

    return tx.financialFiling.update({
      where: { id: filing.id },
      data: { status: "confirmed", confirmedAt: now, extracted: confirmed as unknown as Prisma.InputJsonValue },
      select: summarySelect,
    });
  });

  return { ok: true, filing: toSummary(row) };
}

/** The original document: only the owner of the company, or an admin. */
export async function readFilingFile(user: CurrentUser, projectId: string, year: number) {
  if (!user.onboarded) {
    return null;
  }

  if (user.role !== "admin") {
    const owned = await ownedProjectId(user);

    if (owned !== projectId) {
      return null;
    }
  }

  return prisma.financialFiling.findUnique({
    where: { projectId_year: { projectId, year } },
    select: { fileName: true, mimeType: true, bytes: true },
  });
}
