import * as z from "zod";
import { clean, clip, cnaeOrEmpty, withProvince, yearFromIso } from "./borme-record";
import { anonymousCodename, type RegistryCompany } from "./company-registry";
import { normalizeCif } from "./spanish-cif";

export const apiEmpresasDefaultBaseUrl = "https://apiempresas.es/api/v1";

const text = z.string().nullable().optional();

const legalFormSchema = z.union([
  z.string(),
  z.object({ code: text, label: text }).passthrough(),
]);

const companySchema = z
  .object({
    cif: z.string(),
    name: z.string(),
    cnae: z.union([z.string(), z.number()]).nullable().optional(),
    founded: text,
    province: text,
    municipality: text,
    address: text,
    status: text,
    status_code: text,
    legal_form: legalFormSchema.nullable().optional(),
  })
  .passthrough();

const envelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
});

export type ApiEmpresasCompany = z.infer<typeof companySchema>;

export type ApiEmpresasPayload =
  | { kind: "company"; company: ApiEmpresasCompany }
  | { kind: "not-found" }
  | { kind: "error"; code: string }
  | { kind: "invalid" };

const notFoundCodes = new Set(["COMPANY_NOT_FOUND", "NOT_FOUND", "INVALID_CIF", "INVALID_NIF"]);

export function parseApiEmpresasPayload(payload: unknown): ApiEmpresasPayload {
  const envelope = envelopeSchema.safeParse(payload);

  if (!envelope.success) {
    return { kind: "invalid" };
  }

  if (!envelope.data.success) {
    const code = envelope.data.code ?? envelope.data.error ?? "UNKNOWN";

    return notFoundCodes.has(code) ? { kind: "not-found" } : { kind: "error", code };
  }

  const company = companySchema.safeParse(envelope.data.data);

  return company.success ? { kind: "company", company: company.data } : { kind: "invalid" };
}

export function isMaskedValue(value: string | null | undefined): boolean {
  const folded = (value ?? "").toUpperCase();

  return folded.includes("ACTUALIZA A PRO") || folded.trimStart().startsWith("***");
}

const lowerWords = new Set(["de", "del", "la", "las", "los", "el", "y", "i", "d"]);

export function titleCaseProvince(value: string): string {
  const words = clean(value).toLowerCase().split(" ").filter((word) => word.length > 0);

  return words
    .map((word, index) => (index > 0 && lowerWords.has(word) ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join(" ");
}

function legalFormLabel(value: ApiEmpresasCompany["legal_form"]): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return clean(value) || null;
  }

  return clean(value.label ?? value.code ?? "") || null;
}

function streetAddress(raw: string | null | undefined, municipality: string, province: string): string {
  if (!raw || isMaskedValue(raw)) {
    return "";
  }

  const street = clip(raw, 200);

  if (street.length === 0) {
    return "";
  }

  return withProvince(withProvince(street, municipality), province);
}

export function registryCompanyFromApiEmpresas(
  requestedCif: string,
  company: ApiEmpresasCompany,
): RegistryCompany | null {
  const cif = normalizeCif(requestedCif);

  if (normalizeCif(company.cif) !== cif) {
    return null;
  }

  const legalName = clip(company.name, 160);

  if (legalName.length === 0) {
    return null;
  }

  const province = clip(titleCaseProvince(company.province ?? ""), 80);
  const municipality = titleCaseProvince(company.municipality ?? "");
  const address = clip(streetAddress(company.address, municipality, province), 240);
  const cnae = company.cnae === null || company.cnae === undefined ? "" : String(company.cnae);

  return {
    cif,
    legalName,
    address,
    region: province,
    codename: anonymousCodename(cif),
    foundedYear: yearFromIso(company.founded),
    description: "",
    principalCnae: cnaeOrEmpty(cnae),
    secondaryCnaes: [],
    headcount: null,
    revenueCents: null,
    ebitdaCents: null,
    adjustedEbitdaCents: null,
    statementYear: null,
    legalForm: legalFormLabel(company.legal_form),
    registryStatus: clean(company.status_code ?? company.status ?? "") || null,
  };
}
