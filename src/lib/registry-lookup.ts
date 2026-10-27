import type { RegistryCompany } from "./company-registry";
import { normalizeCif } from "./spanish-cif";

export type RegistrySource = "apiempresas" | "openmercantil";

export type RegistryCacheEntry = {
  found: boolean;
  record: RegistryCompany | null;
  fetchedAt: Date;
};

export type RegistryLookup =
  | { ok: true; record: RegistryCompany | null }
  | { ok: false; code: "unavailable" };

export type ApiEmpresasFetch =
  | { ok: true; record: RegistryCompany | null }
  | { ok: false; code: "auth" | "quota" | "rate" | "unavailable" };

export type RegistryLookupDeps = {
  apiKey: string | null;
  now: () => Date;
  readCache: (cif: string, source: RegistrySource) => Promise<RegistryCacheEntry | null>;
  writeCache: (cif: string, source: RegistrySource, found: boolean, record: RegistryCompany | null) => Promise<void>;
  fetchApiEmpresas: (cif: string, apiKey: string) => Promise<ApiEmpresasFetch>;
  fetchOpenMercantil: (cif: string) => Promise<RegistryLookup>;
  warn: (message: string) => void;
};

const dayMs = 24 * 60 * 60 * 1000;
export const foundTtlMs = 30 * dayMs;
export const notFoundTtlMs = 2 * dayMs;

function isFresh(entry: RegistryCacheEntry, now: Date): boolean {
  const ttl = entry.found ? foundTtlMs : notFoundTtlMs;

  return now.getTime() - entry.fetchedAt.getTime() < ttl;
}

export function mergeMissing(primary: RegistryCompany, extra: RegistryCompany | null): RegistryCompany {
  if (extra === null) {
    return primary;
  }

  return {
    ...primary,
    address: primary.address || extra.address,
    region: primary.region || extra.region,
    foundedYear: primary.foundedYear ?? extra.foundedYear,
    principalCnae: primary.principalCnae || extra.principalCnae,
    headcount: primary.headcount ?? extra.headcount,
  };
}

export function createRegistryLookup(deps: RegistryLookupDeps) {
  async function readFresh(cif: string, source: RegistrySource): Promise<RegistryCacheEntry | null> {
    try {
      const entry = await deps.readCache(cif, source);

      return entry && isFresh(entry, deps.now()) ? entry : null;
    } catch {
      return null;
    }
  }

  async function store(
    cif: string,
    source: RegistrySource,
    found: boolean,
    record: RegistryCompany | null,
  ): Promise<void> {
    try {
      await deps.writeCache(cif, source, found, record);
    } catch {
      deps.warn("registry cache write failed");
    }
  }

  async function viaOpenMercantil(cif: string): Promise<RegistryLookup> {
    const cached = await readFresh(cif, "openmercantil");

    if (cached) {
      return { ok: true, record: cached.record };
    }

    const result = await deps.fetchOpenMercantil(cif);

    if (result.ok) {
      await store(cif, "openmercantil", result.record !== null, result.record);
    }

    return result;
  }

  async function viaApiEmpresas(cif: string, apiKey: string): Promise<RegistryCompany | null> {
    const cached = await readFresh(cif, "apiempresas");

    if (cached) {
      return cached.record;
    }

    const result = await deps.fetchApiEmpresas(cif, apiKey);

    if (!result.ok) {
      deps.warn(`apiempresas lookup skipped: ${result.code}`);

      return null;
    }

    await store(cif, "apiempresas", result.record !== null, result.record);

    return result.record;
  }

  return async function lookup(rawCif: string): Promise<RegistryLookup> {
    const cif = normalizeCif(rawCif);
    const apiKey = deps.apiKey?.trim() ?? "";

    if (apiKey.length > 0) {
      const record = await viaApiEmpresas(cif, apiKey);

      if (record) {
        if (record.address.length > 0 && record.principalCnae.length > 0) {
          return { ok: true, record };
        }

        const fallback = await viaOpenMercantil(cif);

        return { ok: true, record: mergeMissing(record, fallback.ok ? fallback.record : null) };
      }
    }

    return viaOpenMercantil(cif);
  };
}
