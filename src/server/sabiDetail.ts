import { centsToEuroInput, optionalEurosToCents } from "@/lib/company-draft";
import {
  sabiCompanyDetailFields,
  sabiYearDetailFields,
  type SabiCompanyDetailColumn,
  type SabiYearDetailColumn,
} from "@/lib/sabi/detail-fields";
import { prisma } from "@/server/db";

/** t62: the SABI detail block of the ficha (company identity + per-year detail lines), as form strings. */
export type SabiDetailYear = {
  year: number;
  source: string | null;
  values: Record<SabiYearDetailColumn, string>;
};
export type SabiDetailForm = {
  projectId: string;
  imported: boolean;
  company: Record<SabiCompanyDetailColumn, string>;
  years: SabiDetailYear[];
};

const companySelect = Object.fromEntries(
  sabiCompanyDetailFields.map((field) => [field.column, true]),
) as Record<SabiCompanyDetailColumn, true>;
const yearSelect = Object.fromEntries(
  sabiYearDetailFields.map((field) => [field.column, true]),
) as Record<SabiYearDetailColumn, true>;

function toInput(kind: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (kind === "money" && typeof value === "number") {
    return centsToEuroInput(value);
  }

  return String(value);
}

export async function getSabiDetail(
  projectId: string,
): Promise<SabiDetailForm | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      sabiImportedAt: true,
      ...companySelect,
      years: {
        where: { kind: "closed" },
        orderBy: { year: "desc" },
        select: { year: true, dataSource: true, ...yearSelect },
      },
    },
  });

  if (!project) {
    return null;
  }

  const row = project as unknown as Record<string, unknown>;

  return {
    projectId: project.id,
    imported: project.sabiImportedAt !== null,
    company: Object.fromEntries(
      sabiCompanyDetailFields.map((field) => [
        field.column,
        toInput(field.kind, row[field.column]),
      ]),
    ) as Record<SabiCompanyDetailColumn, string>,
    years: project.years.map((year) => {
      const values = year as unknown as Record<string, unknown>;
      return {
        year: year.year,
        source: year.dataSource,
        values: Object.fromEntries(
          sabiYearDetailFields.map((field) => [
            field.column,
            toInput("money", values[field.column]),
          ]),
        ) as Record<SabiYearDetailColumn, string>,
      };
    }),
  };
}

const moneyPattern = /^-?\d{1,15}(,\d{1,2})?$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type SabiDetailSaveResult = { ok: true } | { ok: false; field: string };

/** Reads `company_<column>` and `year_<year>_<column>` fields. Blank clears the value. */
export async function saveSabiDetail(
  projectId: string,
  ownerId: string,
  formData: FormData,
): Promise<SabiDetailSaveResult> {
  const owned = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });
  if (!owned) {
    return { ok: false, field: "empresa" };
  }
  const read = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : null;
  };
  const company: Record<string, string | number | null> = {};

  for (const field of sabiCompanyDetailFields) {
    const value = read(`company_${field.column}`);

    if (value === null) {
      continue;
    }

    if (value === "") {
      company[field.column] = null;
    } else if (field.kind === "money") {
      if (!moneyPattern.test(value.replace(/\./g, ""))) {
        return { ok: false, field: field.label };
      }

      company[field.column] = optionalEurosToCents(value.replace(/\./g, ""));
    } else if (field.kind === "integer") {
      if (!/^\d{1,7}$/.test(value)) {
        return { ok: false, field: field.label };
      }

      company[field.column] = Number(value);
    } else if (field.kind === "date") {
      if (!datePattern.test(value)) {
        return { ok: false, field: field.label };
      }

      company[field.column] = value;
    } else {
      company[field.column] = value.slice(0, "max" in field ? field.max : 200);
    }
  }

  const years = await prisma.projectYear.findMany({
    where: { projectId, kind: "closed" },
    select: { id: true, year: true },
  });
  const updates: Array<{ id: string; data: Record<string, number | null> }> =
    [];

  for (const year of years) {
    const data: Record<string, number | null> = {};

    for (const field of sabiYearDetailFields) {
      const value = read(`year_${year.year}_${field.column}`);

      if (value === null) {
        continue;
      }

      const clean = value.replace(/\./g, "");

      if (clean !== "" && !moneyPattern.test(clean)) {
        return { ok: false, field: `${field.label} ${year.year}` };
      }

      data[field.column] = optionalEurosToCents(clean);
    }

    if (Object.keys(data).length > 0) {
      updates.push({ id: year.id, data });
    }
  }

  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: company }),
    ...updates.map((update) =>
      prisma.projectYear.update({
        where: { id: update.id },
        data: update.data,
      }),
    ),
  ]);

  return { ok: true };
}
