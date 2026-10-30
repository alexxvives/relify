import { randomUUID } from "node:crypto";
import * as z from "zod";
import { Prisma } from "@/generated/prisma/client";
import { isCnaeCode } from "@/lib/cnae-2009";
import { mapSabiReport, sabiCompanyDetail, sabiExtraOf, sabiYearDetail, type SabiMapping } from "@/lib/sabi/mapping";
import { parseSabiWorkbook, type SabiReport } from "@/lib/sabi/parse";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const projectIdSchema = z.string().trim().min(1).max(128);
const maxBytes = 10 * 1024 * 1024;

export type SabiPreviewYear = {
  year: number;
  months: number | null;
  salesCents: number | null;
  ebitdaCents: number | null;
  netResultCents: number | null;
  totalAssetsCents: number | null;
  equityCents: number | null;
  employees: number | null;
  replacesSeller: boolean;
};

export type SabiPreview = {
  fileName: string;
  legalName: string | null;
  cif: string | null;
  legalForm: string | null;
  address: string | null;
  incorporatedOn: string | null;
  employees: number | null;
  cnae: string | null;
  yearsInFile: number;
  years: SabiPreviewYear[];
  directors: number;
  shareholders: number;
  warnings: string[];
};

export type SabiImportFailure = "forbidden" | "not_found" | "empty" | "too_large" | "not_xlsx" | "no_financials";

export type SabiImportResult<T> = { ok: true; value: T } | { ok: false; code: SabiImportFailure };

/** What we keep from the file: everything SABI gives, admin-only. */
export type SabiStored = { version: 1; report: SabiReport; importedById: string };

type Loaded = {
  project: {
    id: string;
    cif: string;
    legalName: string;
    address: string;
    foundedYear: number | null;
    region: string;
    opexCents: number | null;
    netDebtCents: number | null;
    workingCapitalCents: number | null;
    _count: { shareholders: number; activitySlices: number };
  }; report: SabiReport; mapping: SabiMapping; warnings: string[]; sellerYears: Set<number> };

async function load(user: CurrentUser, projectId: string, bytes: Uint8Array): Promise<SabiImportResult<Loaded>> {
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
      netDebtCents: true,
      workingCapitalCents: true,
      years: { select: { year: true, kind: true, dataSource: true } },
      _count: { select: { shareholders: true, activitySlices: { where: { kind: "capital" } } } },
    },
  });

  if (!project) {
    return { ok: false, code: "not_found" };
  }

  const parsed = await parseSabiWorkbook(bytes);

  if (!parsed.ok) {
    return { ok: false, code: parsed.code };
  }

  const mapping = mapSabiReport(parsed.report);
  const warnings = [...parsed.report.warnings, ...mapping.warnings];
  const fileCif = parsed.report.identity.cif;
  const projectCif = project.cif.trim().toUpperCase();

  if (fileCif && projectCif && fileCif !== projectCif) {
    warnings.unshift(`El CIF del archivo (${fileCif}) no coincide con el de la empresa (${projectCif}).`);
  }

  const imported = new Set(mapping.years.map((year) => year.year));
  const sellerYears = new Set(
    project.years.filter((year) => year.kind === "closed" && year.dataSource !== "sabi" && imported.has(year.year)).map((year) => year.year),
  );

  if (sellerYears.size > 0) {
    warnings.push(`Se sustituyen las cifras que ya había para ${[...sellerYears].sort().join(", ")}.`);
  }

  if (parsed.report.unmappedLabels.length > 0) {
    warnings.push(`Líneas del archivo que no se usan: ${parsed.report.unmappedLabels.slice(0, 8).join(", ")}${parsed.report.unmappedLabels.length > 8 ? "…" : ""}.`);
  }

  return { ok: true, value: { project, report: parsed.report, mapping, warnings, sellerYears } };
}

export async function previewSabiImport(user: CurrentUser, projectId: string, bytes: Uint8Array, fileName: string): Promise<SabiImportResult<SabiPreview>> {
  const loaded = await load(user, projectId, bytes);

  if (!loaded.ok) {
    return loaded;
  }

  const { report, mapping, warnings, sellerYears } = loaded.value;
  const byYear = new Map(report.years.map((year) => [year.year, year]));

  return {
    ok: true,
    value: {
      fileName: fileName.slice(0, 200),
      legalName: report.identity.legalName,
      cif: report.identity.cif,
      legalForm: report.identity.legalForm,
      address: mapping.project.address,
      incorporatedOn: report.identity.incorporatedOn,
      employees: report.identity.employees,
      cnae: report.codes.cnae2009?.primary[0] ? `${report.codes.cnae2009.primary[0].code} · ${report.codes.cnae2009.primary[0].description}` : null,
      yearsInFile: report.years.length,
      years: mapping.years.map((year) => {
        const source = byYear.get(year.year);
        return {
          year: year.year,
          months: source?.months ?? null,
          salesCents: year.data.salesCents,
          ebitdaCents: year.ebitdaCents,
          netResultCents: year.data.netResultCents,
          totalAssetsCents: source?.money.totalAssets ?? null,
          equityCents: year.data.equityCents,
          employees: year.employees,
          replacesSeller: sellerYears.has(year.year),
        };
      }),
      directors: report.directors.length,
      shareholders: report.shareholders.length,
      warnings,
    },
  };
}

export async function confirmSabiImport(user: CurrentUser, projectId: string, bytes: Uint8Array, fileName: string): Promise<SabiImportResult<{ years: number[] }>> {
  // Parse again on confirm: never trust a preview round-tripped through the browser.
  const loaded = await load(user, projectId, bytes);

  if (!loaded.ok) {
    return loaded;
  }

  const { project, report, mapping } = loaded.value;
  const now = new Date();
  const stored: SabiStored = { version: 1, report, importedById: user.id };
  const source = new Map(report.years.map((year) => [year.year, year]));
  const company = sabiCompanyDetail(report);
  const json = (value: unknown) => value as Prisma.InputJsonValue;

  await prisma.$transaction(async (tx) => {
    // Replacing an earlier import: drop its closed years first; forecasts stay.
    await tx.projectYear.deleteMany({ where: { projectId: project.id, kind: "closed", dataSource: "sabi" } });

    for (const year of mapping.years) {
      const data = {
        kind: "closed" as const,
        ...year.data,
        employees: year.employees,
        ratios: year.ratios === null ? Prisma.DbNull : (year.ratios as Prisma.InputJsonValue),
        ...(source.get(year.year) ? sabiYearDetail(source.get(year.year)!) : {}),
        dataSource: "sabi",
        confirmedAt: now,
      };
      await tx.projectYear.upsert({
        where: { projectId_year: { projectId: project.id, year: year.year } },
        create: { id: randomUUID(), projectId: project.id, year: year.year, ...data },
        update: data,
      });
    }

    const latestClosed = await tx.projectYear.findFirst({
      where: { projectId: project.id, kind: "closed" },
      orderBy: { year: "desc" },
      select: { dataSource: true },
    });
    const figures = mapping.project;
    const useFigures = latestClosed?.dataSource === "sabi";

    await tx.project.update({
      where: { id: project.id },
      data: {
        sabiImportedAt: now,
        sabiFileName: fileName.slice(0, 200),
        sabiData: stored as unknown as Prisma.InputJsonValue,
        ...(project.legalName.trim() === "" && figures.legalName ? { legalName: figures.legalName } : {}),
        ...(project.address.trim() === "" && figures.address ? { address: figures.address } : {}),
        ...(project.cif.trim() === "" && report.identity.cif ? { cif: report.identity.cif } : {}),
        ...(figures.foundedYear !== null ? { foundedYear: figures.foundedYear } : {}),
        ...(figures.headcountRange !== null ? { headcountRange: figures.headcountRange } : {}),
        ...(useFigures && figures.revenueCents !== null ? { revenueCents: figures.revenueCents } : {}),
        ...(useFigures && figures.ebitdaCents !== null ? { ebitdaCents: figures.ebitdaCents } : {}),
        ...(useFigures && figures.netIncomeCents !== null ? { netIncomeCents: figures.netIncomeCents } : {}),
        ...(useFigures && figures.averageHeadcount !== null ? { averageHeadcount: figures.averageHeadcount } : {}),
        // t60: every remaining ficha line SABI can answer. Seller-entered values win where they exist.
        ...(useFigures && project.opexCents === null && figures.opexCents !== null ? { opexCents: figures.opexCents } : {}),
        ...(useFigures && figures.netDebtCents !== null ? { netDebtCents: figures.netDebtCents } : {}),
        ...(useFigures && figures.workingCapitalCents !== null ? { workingCapitalCents: figures.workingCapitalCents } : {}),
        ...(project.region.trim() === "" && figures.region ? { region: figures.region } : {}),
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
        sabiExtra: json(sabiExtraOf(report, mapping.years.map((year) => year.year))),
      },
    });

    if (project._count.shareholders === 0 && figures.shareholderNames.length > 0) {
      await tx.shareholder.createMany({ data: figures.shareholderNames.map((name) => ({ id: randomUUID(), projectId: project.id, name: name.slice(0, 200) })) });
    }

    if (project._count.activitySlices === 0 && figures.capitalBasisPoints) {
      await tx.activitySlice.createMany({
        data: figures.capitalBasisPoints.map((basisPoints, index) => ({ id: randomUUID(), projectId: project.id, kind: "capital" as const, position: index + 1, basisPoints })),
      });
    }

    const hasCnae = await tx.projectCnae.count({ where: { projectId: project.id } });
    const codes = [figures.principalCnae, ...figures.secondaryCnaes].filter((code): code is string => code !== null && isCnaeCode(code));

    if (hasCnae === 0 && codes.length > 0) {
      await tx.projectCnae.createMany({
        data: [...new Set(codes)].map((code, position) => ({
          id: randomUUID(),
          projectId: project.id,
          code,
          role: position === 0 ? ("principal" as const) : ("secondary" as const),
          position: position === 0 ? 1 : position,
        })),
      });
    }
  });

  return { ok: true, value: { years: mapping.years.map((year) => year.year) } };
}

/** Admin-only view of the stored SABI record (directors, shareholders, ratios…). */
export function readSabiStored(value: unknown): SabiStored | null {
  if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1) {
    return null;
  }

  return value as SabiStored;
}
