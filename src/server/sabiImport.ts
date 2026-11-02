import { randomUUID } from "node:crypto";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { adjustedEbitdaCents, storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { isCnaeCode } from "@/lib/cnae-2009";
import {
  mapSabiReport,
  sabiCompanyDetail,
  sabiExtraOf,
  sabiYearDetail,
  type SabiMapping,
} from "@/lib/sabi/mapping";
import {
  parseSabiWorkbook,
  parseSabiWorkbookStaged,
  type SabiReport,
  type SabiStageEvent,
} from "@/lib/sabi/parse";
import { sabiMaxBytes, type SabiImportFailure } from "@/lib/sabi/failures";
import { sabiPreviewWarnings } from "@/lib/sabi/preview";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const projectIdSchema = z.string().trim().min(1).max(128);
const maxBytes = sabiMaxBytes;

export type { SabiPreview, SabiPreviewYear } from "@/lib/sabi/preview";

export type { SabiImportFailure } from "@/lib/sabi/failures";

export type SabiImportResult<T> =
  { ok: true; value: T } | { ok: false; code: SabiImportFailure };

/** What we keep from the file: everything SABI gives, admin-only. */
export type SabiStored = {
  version: 1;
  report: SabiReport;
  importedById: string;
};

type Loaded = {
  project: {
    id: string;
    cif: string;
    legalName: string;
    address: string;
    foundedYear: number | null;
    region: string;
    opexCents: number | null;
    ebitdaAdjustments: unknown;
    netDebtCents: number | null;
    workingCapitalCents: number | null;
    years: { year: number; kind: string; dataSource: string | null }[];
    _count: { shareholders: number; activitySlices: number; cnaes: number };
  };
  report: SabiReport;
  mapping: SabiMapping;
  warnings: string[];
  sellerYears: Set<number>;
};

async function load(
  user: CurrentUser,
  projectId: string,
  bytes: Uint8Array,
  onStage?: (event: SabiStageEvent) => Promise<void>,
): Promise<SabiImportResult<Loaded>> {
  // Server-side guard: only admins import SABI, whatever the UI shows.
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, code: "forbidden" };
  }

  const id = projectIdSchema.safeParse(projectId);

  if (!id.success) {
    return { ok: false, code: "not_found" };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, code: "empty" };
  }

  if (bytes.byteLength > maxBytes) {
    return { ok: false, code: "too_large" };
  }

  const project = await prisma.project.findUnique({
    where: { id: id.data },
    select: {
      id: true,
      cif: true,
      legalName: true,
      address: true,
      foundedYear: true,
      region: true,
      opexCents: true,
      ebitdaAdjustments: true,
      netDebtCents: true,
      workingCapitalCents: true,
      years: { select: { year: true, kind: true, dataSource: true } },
      _count: {
        select: {
          shareholders: true,
          activitySlices: { where: { kind: "capital" } },
          cnaes: true,
        },
      },
    },
  });

  if (!project) {
    return { ok: false, code: "not_found" };
  }

  const parsed = onStage
    ? await parseSabiWorkbookStaged(bytes, onStage)
    : await parseSabiWorkbook(bytes);

  if (!parsed.ok) {
    return { ok: false, code: parsed.code };
  }

  const mapping = mapSabiReport(parsed.report);
  const { warnings, sellerYears } = sabiPreviewWarnings(
    parsed.report,
    mapping,
    {
      cif: project.cif,
      sellerClosedYears: project.years
        .filter((year) => year.kind === "closed" && year.dataSource !== "sabi")
        .map((year) => year.year),
    },
  );

  return {
    ok: true,
    value: { project, report: parsed.report, mapping, warnings, sellerYears },
  };
}

export async function confirmSabiImport(
  user: CurrentUser,
  projectId: string,
  bytes: Uint8Array,
  fileName: string,
  onStage?: (
    event: SabiStageEvent | { stage: "saving"; count: number },
  ) => Promise<void>,
): Promise<SabiImportResult<{ years: number[] }>> {
  // Parse again on confirm: never trust a preview round-tripped through the browser.
  const loaded = await load(user, projectId, bytes, onStage);

  if (!loaded.ok) {
    return loaded;
  }

  const { project, report, mapping } = loaded.value;
  const now = new Date();
  // t67: sabi_extra keeps the raw sheet; don't store it twice.
  const stored: SabiStored = {
    version: 1,
    report: { ...report, sheet: [] },
    importedById: user.id,
  };
  const source = new Map(report.years.map((year) => [year.year, year]));
  const company = sabiCompanyDetail(report);
  const json = (value: unknown) => value as Prisma.InputJsonValue;
  const importedYears = mapping.years.map((year) => year.year);

  // t67: everything known up front, so the write is one batched transaction (one round trip on
  // Neon) instead of an interactive one with a query per year.
  const remainingClosed = project.years
    .filter(
      (year) =>
        year.kind === "closed" &&
        year.dataSource !== "sabi" &&
        !importedYears.includes(year.year),
    )
    .map((year) => year.year);
  const latestImported = Math.max(-Infinity, ...importedYears);
  const latestOther = Math.max(-Infinity, ...remainingClosed);
  const useFigures = importedYears.length > 0 && latestImported >= latestOther;
  const figures = mapping.project;
  const codes = [
    ...new Set(
      [figures.principalCnae, ...figures.secondaryCnaes].filter(
        (code): code is string => code !== null && isCnaeCode(code),
      ),
    ),
  ];

  const listedAdjustments = storedEbitdaAdjustments(project.ebitdaAdjustments);
  const writes: Prisma.PrismaPromise<unknown>[] = [
    // Replacing an earlier import: drop its closed years (and any row for an imported year); other forecasts stay.
    prisma.projectYear.deleteMany({
      where: {
        projectId: project.id,
        OR: [
          { kind: "closed", dataSource: "sabi" },
          { year: { in: importedYears } },
        ],
      },
    }),
    prisma.projectYear.createMany({
      data: mapping.years.map((year) => ({
        id: randomUUID(),
        projectId: project.id,
        year: year.year,
        kind: "closed" as const,
        ...year.data,
        employees: year.employees,
        ratios:
          year.ratios === null
            ? Prisma.DbNull
            : (year.ratios as Prisma.InputJsonValue),
        ...(source.get(year.year)
          ? sabiYearDetail(source.get(year.year)!)
          : {}),
        dataSource: "sabi",
        confirmedAt: now,
      })),
    }),
    prisma.project.update({
      where: { id: project.id },
      data: {
        sabiImportedAt: now,
        sabiFileName: fileName.slice(0, 200),
        sabiData: stored as unknown as Prisma.InputJsonValue,
        ...(project.legalName.trim() === "" && figures.legalName
          ? { legalName: figures.legalName }
          : {}),
        ...(project.address.trim() === "" && figures.address
          ? { address: figures.address }
          : {}),
        ...(project.cif.trim() === "" && report.identity.cif
          ? { cif: report.identity.cif }
          : {}),
        ...(figures.foundedYear !== null
          ? { foundedYear: figures.foundedYear }
          : {}),
        ...(figures.headcountRange !== null
          ? { headcountRange: figures.headcountRange }
          : {}),
        ...(useFigures && figures.revenueCents !== null
          ? { revenueCents: figures.revenueCents }
          : {}),
        ...(useFigures && figures.ebitdaCents !== null
          ? { ebitdaCents: figures.ebitdaCents }
          : {}),
        // t82: an itemised adjusted EBITDA follows the newly imported accounts EBITDA.
        ...(useFigures && figures.ebitdaCents !== null && listedAdjustments
          ? { adjustedEbitdaCents: adjustedEbitdaCents(figures.ebitdaCents, listedAdjustments) }
          : {}),
        ...(useFigures && figures.netIncomeCents !== null
          ? { netIncomeCents: figures.netIncomeCents }
          : {}),
        ...(useFigures && figures.averageHeadcount !== null
          ? { averageHeadcount: figures.averageHeadcount }
          : {}),
        // t60: every remaining ficha line SABI can answer. Seller-entered values win where they exist.
        ...(useFigures &&
        project.opexCents === null &&
        figures.opexCents !== null
          ? { opexCents: figures.opexCents }
          : {}),
        ...(useFigures && figures.netDebtCents !== null
          ? { netDebtCents: figures.netDebtCents }
          : {}),
        ...(useFigures && figures.workingCapitalCents !== null
          ? { workingCapitalCents: figures.workingCapitalCents }
          : {}),
        ...(project.region.trim() === "" && figures.region
          ? { region: figures.region }
          : {}),
        legalForm: figures.legalForm,
        accountsFormat: figures.accountsFormat,
        audited: figures.audited,
        // t62: every SABI datum gets a column; the rest goes to sabi_extra.
        ...company,
        activityCodes: json(company.activityCodes),
        directors: json(company.directors),
        shareholdings: json(company.shareholdings),
        subsidiaries: json(company.subsidiaries),
        banks: json(company.banks),
        audits: json(company.audits),
        sabiExtra: json(sabiExtraOf(report, importedYears)),
      },
    }),
  ];

  if (
    project._count.shareholders === 0 &&
    figures.shareholderNames.length > 0
  ) {
    writes.push(
      prisma.shareholder.createMany({
        data: figures.shareholderNames.map((name) => ({
          id: randomUUID(),
          projectId: project.id,
          name: name.slice(0, 200),
        })),
      }),
    );
  }

  if (project._count.activitySlices === 0 && figures.capitalBasisPoints) {
    writes.push(
      prisma.activitySlice.createMany({
        data: figures.capitalBasisPoints.map((basisPoints, index) => ({
          id: randomUUID(),
          projectId: project.id,
          kind: "capital" as const,
          position: index + 1,
          basisPoints,
        })),
      }),
    );
  }

  if (project._count.cnaes === 0 && codes.length > 0) {
    writes.push(
      prisma.projectCnae.createMany({
        data: codes.map((code, position) => ({
          id: randomUUID(),
          projectId: project.id,
          code,
          role:
            position === 0 ? ("principal" as const) : ("secondary" as const),
          position: position === 0 ? 1 : position,
        })),
      }),
    );
  }

  await onStage?.({ stage: "saving", count: writes.length });
  await prisma.$transaction(writes);

  return { ok: true, value: { years: mapping.years.map((year) => year.year) } };
}

/** Admin-only view of the stored SABI record (directors, shareholders, ratios…). */
export function readSabiStored(value: unknown): SabiStored | null {
  if (
    !value ||
    typeof value !== "object" ||
    (value as { version?: unknown }).version !== 1
  ) {
    return null;
  }

  return value as SabiStored;
}
