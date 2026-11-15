import { anonymousCodename, type RegistryCompany } from "@/lib/company-registry";
import type { RegistryLookup } from "@/lib/registry-lookup";
import { normalizeCif } from "@/lib/spanish-cif";

/**
 * INT never calls billable registries (API Empresas / OpenMercantil).
 * A known test CIF returns the seed company so CIF verification can be exercised.
 * Any other valid CIF is an honest miss: the seller can continue and fill the ficha.
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
