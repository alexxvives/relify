import * as z from "zod";
import { isCnaeCode } from "./cnae-2009";
import { anonymousCodename, type RegistryCompany } from "./company-registry";
import { isFoundedYear, type HeadcountRangeId } from "./company-profile";
import { normalizeCif } from "./spanish-cif";

const searchHitSchema = z.object({
  slug: z.string(),
  name: z.string(),
  cif: z.string(),
  province: z.string().nullable().optional(),
  cnae_code: z.string().nullable().optional(),
});

const searchResponseSchema = z.object({
  items: z.array(searchHitSchema),
});

const eventSchema = z.object({
  date: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
});

const companyFileSchema = z.object({
  company: z
    .object({
      name: z.string().optional(),
      cif: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      date_creation: z.string().nullable().optional(),
      workers: z.union([z.string(), z.number()]).nullable().optional(),
      province: z.string().nullable().optional(),
      cnae: z.string().nullable().optional(),
    })
    .optional(),
  events: z.array(eventSchema).optional(),
});

export type BormeSearchHit = z.infer<typeof searchHitSchema>;
export type BormeCompanyFile = z.infer<typeof companyFileSchema>;

const domicilioPattern =
  /(?:cambio de domicilio social|domicilio social|domicilio)\s*:\s*([^\n.]{6,220})/i;

export function parseBormeSearch(
  payload: unknown,
  requestedCif: string,
): { ok: true; hit: BormeSearchHit | null } | { ok: false } {
  if (payload === null) {
    return { ok: true, hit: null };
  }

  const parsed = searchResponseSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false };
  }

  const cif = normalizeCif(requestedCif);
  const hit = parsed.data.items.find((item) => normalizeCif(item.cif) === cif) ?? null;

  return { ok: true, hit };
}

export function parseBormeCompany(payload: unknown): BormeCompanyFile | null {
  const parsed = companyFileSchema.safeParse(payload);

  return parsed.success ? parsed.data : null;
}

export function isCompanySlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function registryCompanyFromBorme(
  requestedCif: string,
  hit: BormeSearchHit,
  file: BormeCompanyFile | null,
): RegistryCompany | null {
  const cif = normalizeCif(requestedCif);

  if (normalizeCif(hit.cif) !== cif) {
    return null;
  }

  const company = file?.company;
  const legalName = clip(company?.name?.trim() || hit.name, 160);

  if (legalName.length === 0) {
    return null;
  }

  const events = file?.events ?? [];
  const province = clip(firstText(hit.province, company?.province, eventProvince(events)), 80);
  const street = clip(structuredAddress(company?.address) || domicilioFromEvents(events), 200);
  const address = clip(street.length === 0 ? "" : withProvince(street, province), 240);

  return {
    cif,
    legalName,
    address,
    region: province,
    codename: anonymousCodename(cif),
    foundedYear: foundedYear(company?.date_creation, events),
    description: "",
    principalCnae: principalCnae(hit.cnae_code, company?.cnae),
    secondaryCnaes: [],
    headcount: headcountFromWorkers(company?.workers),
    revenueCents: null,
    ebitdaCents: null,
    adjustedEbitdaCents: null,
    statementYear: null,
  };
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const cleaned = clean(value ?? "");

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return "";
}

function eventProvince(events: z.infer<typeof eventSchema>[]): string {
  const dated = [...events].sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));

  for (const event of dated) {
    const province = clean(event.province ?? "");

    if (province.length > 0) {
      return province;
    }
  }

  return "";
}

function structuredAddress(value: string | null | undefined): string {
  return clean(value ?? "");
}

function domicilioFromEvents(events: z.infer<typeof eventSchema>[]): string {
  let bestDate = "";
  let bestAddress = "";

  for (const event of events) {
    const details = event.details ?? "";
    const match = domicilioPattern.exec(details);
    const captured = match?.[1];

    if (!captured || isWeakDomicilio(captured)) {
      continue;
    }

    const date = event.date ?? "";

    if (bestAddress.length === 0 || date > bestDate) {
      bestDate = date;
      bestAddress = clean(captured);
    }
  }

  return bestAddress;
}

function isWeakDomicilio(value: string): boolean {
  const folded = fold(value);

  return folded.length < 6 || folded.startsWith("social") || folded.startsWith("el dia");
}

function withProvince(address: string, province: string): string {
  if (province.length === 0 || address.toLowerCase().includes(province.toLowerCase())) {
    return address;
  }

  return `${address}, ${province}`;
}

function foundedYear(
  dateCreation: string | null | undefined,
  events: z.infer<typeof eventSchema>[],
): number | null {
  const stated = yearFromIso(dateCreation);

  if (stated !== null) {
    return stated;
  }

  let earliest: number | null = null;

  for (const event of events) {
    const type = fold(event.type ?? "");
    const details = fold(event.details ?? "").trimStart();

    if (!type.startsWith("constitucion") && !details.startsWith("constitucion")) {
      continue;
    }

    const year = yearFromIso(event.date);

    if (year !== null && (earliest === null || year < earliest)) {
      earliest = year;
    }
  }

  return earliest;
}

function yearFromIso(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value);

  if (!match?.[1]) {
    return null;
  }

  const year = Number(match[1]);

  return isFoundedYear(year) ? year : null;
}

function principalCnae(fromSearch: string | null | undefined, fromCompany: string | null | undefined): string {
  return cnaeOrEmpty(fromSearch) || cnaeOrEmpty(fromCompany);
}

function cnaeOrEmpty(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }

  const trimmed = raw.trim();

  if (isCnaeCode(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length !== 4) {
    return "";
  }

  const dotted = `${digits.slice(0, 2)}.${digits.slice(2)}`;

  return isCnaeCode(dotted) ? dotted : "";
}

function headcountFromWorkers(workers: string | number | null | undefined): HeadcountRangeId | null {
  const text = typeof workers === "number" ? String(workers) : (workers ?? "").trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const count = Number(text);

  if (!Number.isInteger(count) || count < 1) {
    return null;
  }

  if (count <= 5) {
    return "band_1_5";
  }

  if (count <= 10) {
    return "band_6_10";
  }

  if (count <= 20) {
    return "band_11_20";
  }

  if (count <= 50) {
    return "band_21_50";
  }

  return "band_over_50";
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clip(value: string, max: number): string {
  const cleaned = clean(value);

  if (cleaned.length <= max) {
    return cleaned;
  }

  return cleaned.slice(0, max).trim();
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
