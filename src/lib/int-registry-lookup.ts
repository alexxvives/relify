import { anonymousCodename, type RegistryCompany } from "@/lib/company-registry";
import type { RegistryLookup } from "@/lib/registry-lookup";
import { normalizeCif } from "@/lib/spanish-cif";

/**
 * INT never calls OpenMercantil, and calls the paid API Empresas only when `INT_APIEMPRESAS_API_KEY` is set (S26).
 * A known test CIF always returns the seed company so CIF verification can be exercised offline.
 * Without the key, any other valid CIF is an honest miss: the seller can continue and fill the ficha.
 */
export const intRegistryTestCif = "B12345674";

export function intRegistryCompany(cif = intRegistryTestCif): RegistryCompany {
  const normalized = normalizeCif(cif);
  return {
    cif: normalized,
    legalName: "Obrador Ficticio Norte S.L.",
    address: "Calle Ficticia 12, 28001 Madrid",
    region: "Madrid",
    codename: anonymousCodename(normalized),
    foundedYear: 2014,
    description: "",
    principalCnae: "10.71",
    secondaryCnaes: ["10.72"],
    headcount: "band_6_10",
    revenueCents: 185_000_000,
    ebitdaCents: 24_000_000,
    adjustedEbitdaCents: 21_000_000,
    statementYear: 2024,
  };
}

export function lookupIntRegistry(rawCif: string): RegistryLookup {
  const cif = normalizeCif(rawCif);
  if (cif === intRegistryTestCif) {
    return { ok: true, record: intRegistryCompany(cif) };
  }
  return { ok: true, record: null };
}

/** S26: which INT lookup a CIF gets. "mock" for the test CIF or when INT has no API Empresas key. */
export function intRegistryLookupMode(rawCif: string, intApiKey: string): "mock" | "apiempresas" {
  if (normalizeCif(rawCif) === intRegistryTestCif || intApiKey.trim().length === 0) {
    return "mock";
  }
  return "apiempresas";
}
