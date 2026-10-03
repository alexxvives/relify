import { lookupFixtureCompany, type RegistryCompany } from "@/lib/company-registry";

// Live mercantile-registry clients stay unwired. The browser must not call a registry with a secret.
export async function lookupCompanyRegistry(cif: string): Promise<RegistryCompany | null> {
  return lookupFixtureCompany(cif);
}
