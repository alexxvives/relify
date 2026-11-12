import { describe, expect, it } from "vitest";
import {
  isMaskedValue,
  parseApiEmpresasPayload,
  registryCompanyFromApiEmpresas,
  titleCaseProvince,
} from "@/lib/apiempresas";

const full = {
  success: true,
  data: {
    cif: "A15075062",
    name: "INDUSTRIA DE DISEÑO TEXTIL SA",
    cnae: "4642",
    cnae_label: "Comercio al por mayor de prendas de vestir",
    founded: "1985-05-12",
    province: "A CORUÑA",
    municipality: "ARTEIXO",
    address: "AVENIDA DE LA DIPUTACION S/N",
    status: "ACTIVA",
    status_code: "ACTIVE",
    legal_form: { code: "SA", label: "Sociedad Anónima", iso20275: "5RDO", source: "name" },
  },
};

function companyOf(payload: unknown) {
  const parsed = parseApiEmpresasPayload(payload);

  if (parsed.kind !== "company") {
    throw new Error("expected a company payload");
  }

  return parsed.company;
}

describe("parseApiEmpresasPayload", () => {
  it("reads a successful envelope", () => {
    expect(parseApiEmpresasPayload(full).kind).toBe("company");
  });

  it("treats COMPANY_NOT_FOUND as not found", () => {
    expect(parseApiEmpresasPayload({ success: false, error: "COMPANY_NOT_FOUND" })).toEqual({ kind: "not-found" });
  });

  it("surfaces other error codes", () => {
    expect(parseApiEmpresasPayload({ success: false, error: "X", code: "QUOTA_EXCEEDED" })).toEqual({
      kind: "error",
      code: "QUOTA_EXCEEDED",
    });
  });

  it("rejects payloads that are not an envelope", () => {
    expect(parseApiEmpresasPayload("nope").kind).toBe("invalid");
    expect(parseApiEmpresasPayload({ success: true, data: { cif: "A1" } }).kind).toBe("invalid");
  });
});

describe("registryCompanyFromApiEmpresas", () => {
  it("maps the Pro response onto our fields", () => {
    const record = registryCompanyFromApiEmpresas("a-15075062", companyOf(full));

    expect(record).toMatchObject({
      cif: "A15075062",
      legalName: "INDUSTRIA DE DISEÑO TEXTIL SA",
      region: "A Coruña",
      foundedYear: 1985,
      principalCnae: "46.42",
      legalForm: "Sociedad Anónima",
      registryStatus: "ACTIVE",
    });
    expect(record?.address).toBe("AVENIDA DE LA DIPUTACION S/N, Arteixo, A Coruña");
  });

  it("drops the masked address the Free plan returns", () => {
    const free = {
      success: true,
      data: { ...full.data, address: "*** [ACTUALIZA A PRO PARA VER LA DIRECCION ]", upsell_opportunities: {} },
    };
    const record = registryCompanyFromApiEmpresas("A15075062", companyOf(free));

    expect(record?.address).toBe("");
    expect(record?.legalName).toBe("INDUSTRIA DE DISEÑO TEXTIL SA");
  });

  it("accepts legal_form as a plain string and a missing CNAE", () => {
    const loose = { success: true, data: { cif: "B12345674", name: "EJEMPLO SL", legal_form: "Sociedad Limitada" } };
    const record = registryCompanyFromApiEmpresas("B12345674", companyOf(loose));

    expect(record?.legalForm).toBe("Sociedad Limitada");
    expect(record?.principalCnae).toBe("");
    expect(record?.foundedYear).toBeNull();
  });

  it("refuses a record for a different CIF", () => {
    expect(registryCompanyFromApiEmpresas("B00000000", companyOf(full))).toBeNull();
  });
});

describe("helpers", () => {
  it("title-cases provinces", () => {
    expect(titleCaseProvince("SANTA CRUZ DE TENERIFE")).toBe("Santa Cruz de Tenerife");
    expect(titleCaseProvince("MADRID")).toBe("Madrid");
  });

  it("detects masked values", () => {
    expect(isMaskedValue("*** [ACTUALIZA A PRO PARA VER LA DIRECCION ]")).toBe(true);
    expect(isMaskedValue("CALLE MAYOR 1")).toBe(false);
  });
});
