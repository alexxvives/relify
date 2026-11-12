import {
  isCompanySlug,
  parseBormeCompany,
  parseBormeSearch,
  registryCompanyFromBorme,
} from "@/lib/borme-record";
import type { RegistryCompany } from "@/lib/company-registry";
import {
  createRegistryLookup,
  type RegistryCacheEntry,
  type RegistryLookup,
  type RegistrySource,
} from "@/lib/registry-lookup";
import { normalizeCif } from "@/lib/spanish-cif";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { fetchApiEmpresas } from "@/lib/server/fetch-api-empresas";

const searchUrl = "https://openmercantil.es/api/v1/search";
const companyUrl = "https://openmercantil.es/api/v1/company";

export type { RegistryLookup };

export async function lookupCompanyRegistry(
  cif: string,
): Promise<RegistryLookup> {
  return createRegistryLookup({
    apiKey: process.env.APIEMPRESAS_API_KEY ?? null,
    now: () => new Date(),
    readCache,
    writeCache,
    fetchApiEmpresas,
    fetchOpenMercantil: lookupOpenMercantil,
    warn: (message) => {
      console.warn(`[registry] ${message}`);
    },
  })(cif);
}

async function readCache(
  cif: string,
  source: RegistrySource,
): Promise<RegistryCacheEntry | null> {
  const row = await prisma.companyRegistryCache.findUnique({
    where: { cif_source: { cif, source } },
  });

  if (!row) {
    return null;
  }

  return {
    found: row.found,
    record: row.found ? (row.record as RegistryCompany | null) : null,
    fetchedAt: row.fetchedAt,
  };
}

async function writeCache(
  cif: string,
  source: RegistrySource,
  found: boolean,
  record: RegistryCompany | null,
): Promise<void> {
  const json =
    found && record
      ? (record as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull;
  const data = { found, record: json, fetchedAt: new Date() };

  await prisma.companyRegistryCache.upsert({
    where: { cif_source: { cif, source } },
    create: { cif, source, ...data },
    update: data,
  });
}

async function lookupOpenMercantil(cif: string): Promise<RegistryLookup> {
  const normalized = normalizeCif(cif);
  const searchPayload = await readJson(
    `${searchUrl}?q=${encodeURIComponent(normalized)}`,
  );

  if (!searchPayload.ok) {
    return searchPayload;
  }

  const parsedSearch = parseBormeSearch(searchPayload.payload, normalized);

  if (!parsedSearch.ok) {
    return { ok: false, code: "unavailable" };
  }

  const hit = parsedSearch.hit;

  if (!hit) {
    return { ok: true, record: null };
  }

  if (!isCompanySlug(hit.slug)) {
    return {
      ok: true,
      record: registryCompanyFromBorme(normalized, hit, null),
    };
  }

  const companyPayload = await readJson(`${companyUrl}/${hit.slug}`);
  const file = companyPayload.ok
    ? parseBormeCompany(companyPayload.payload)
    : null;

  return { ok: true, record: registryCompanyFromBorme(normalized, hit, file) };
}

async function readJson(
  url: string,
): Promise<
  { ok: true; payload: unknown } | { ok: false; code: "unavailable" }
> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (response.status === 404) {
      return { ok: true, payload: null };
    }

    if (!response.ok) {
      return { ok: false, code: "unavailable" };
    }

    return { ok: true, payload: await response.json() };
  } catch {
    return { ok: false, code: "unavailable" };
  }
}
