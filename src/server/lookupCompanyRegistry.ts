import {
  isCompanySlug,
  parseBormeCompany,
  parseBormeSearch,
  registryCompanyFromBorme,
} from "@/lib/borme-record";
import type { RegistryCompany } from "@/lib/company-registry";
import { normalizeCif } from "@/lib/spanish-cif";

const searchUrl = "https://openmercantil.es/api/v1/search";
const companyUrl = "https://openmercantil.es/api/v1/company";

export type RegistryLookup =
  | { ok: true; record: RegistryCompany | null }
  | { ok: false; code: "unavailable" };

export async function lookupCompanyRegistry(cif: string): Promise<RegistryLookup> {
  const normalized = normalizeCif(cif);
  const searchPayload = await readJson(`${searchUrl}?q=${encodeURIComponent(normalized)}`);

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
    return { ok: true, record: registryCompanyFromBorme(normalized, hit, null) };
  }

  const companyPayload = await readJson(`${companyUrl}/${hit.slug}`);
  const file = companyPayload.ok ? parseBormeCompany(companyPayload.payload) : null;

  return { ok: true, record: registryCompanyFromBorme(normalized, hit, file) };
}

async function readJson(url: string): Promise<{ ok: true; payload: unknown } | { ok: false; code: "unavailable" }> {
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
