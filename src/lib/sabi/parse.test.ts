import { describe, expect, it } from "vitest";
import { syntheticRows, syntheticWorkbook, zip } from "./__fixtures__/synthetic";
import { accountsFormatOf, capitalSplit, mapSabiReport } from "./mapping";
import { parseSabiNumber, parseSabiWorkbook } from "./parse";

async function report() {
  const result = await parseSabiWorkbook(syntheticWorkbook());

  if (!result.ok) {
    throw new Error(result.code);
  }

  return result.report;
}

describe("parseSabiNumber", () => {
  it("reads Spanish numbers and SABI blanks", () => {
    expect(parseSabiNumber({ text: "1.234,56", number: null })).toBe(1234.56);
    expect(parseSabiNumber({ text: "-60.000,00", number: null })).toBe(-60000);
    expect(parseSabiNumber({ text: "n.d.", number: null })).toBeNull();
    expect(parseSabiNumber({ text: "n.s.", number: null })).toBeNull();
    expect(parseSabiNumber({ text: "", number: 12.5 })).toBe(12.5);
  });
});

describe("parseSabiWorkbook", () => {
  it("rejects files that are not workbooks or have no financials", async () => {
    expect(await parseSabiWorkbook(new TextEncoder().encode("hola"))).toEqual({ ok: false, code: "not_xlsx" });
    const empty = await parseSabiWorkbook(
      zip({
        "xl/workbook.xml": '<workbook><sheets><sheet r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml": "<worksheet><sheetData/></worksheet>",
      }),
    );
    expect(empty).toEqual({ ok: false, code: "no_financials" });
  });

  it("reads identity and activity codes", async () => {
    const { identity, codes } = await report();
    expect(identity.legalName).toBe("EMPRESA FICTICIA DE PRUEBAS SL");
    expect(identity.cif).toBe("B12345674");
    expect(identity.legalForm).toBe("Sociedad limitada");
    expect(identity.incorporatedOn).toBe("2000-01-01");
    expect(identity.employees).toBe(12);
    expect(identity.postalCode).toBe("28001");
    expect(identity.city).toBe("MADRID");
    expect(identity.street).toBe("CALLE FALSA, 123");
    expect(codes.cnae2009?.primary).toEqual([{ code: "6920", description: "Actividades de contabilidad" }]);
    expect(codes.cnae2009?.secondary[0]?.code).toBe("8299");
  });

  it("reads every year, scales thousands and flags short years", async () => {
    const { years, warnings } = await report();
    expect(years.map((year) => year.year)).toEqual([2024, 2023]);
    expect(years[0]?.money.sales).toBe(20_000_000);
    expect(years[0]?.money.nonCurrentLiabilities).toBeNull();
    expect(years[1]?.money.sales).toBe(17_500_000);
    expect(years[1]?.months).toBe(11);
    expect(years[0]?.ratios.generalLiquidity).toBe(1.25);
    expect(years[0]?.employees).toBe(12);
    expect(warnings).toContain("El ejercicio 2023 cubre 11 meses, no un año completo.");
    expect(warnings.some((warning) => warning.includes("miles"))).toBe(true);
  });

  it("reads directors, shareholders, auditor and banks", async () => {
    const parsed = await report();
    expect(parsed.directors).toEqual([
      { name: "Doña Persona Inventada", role: "Administrador Único", since: "2010-02-01", department: "BoD", group: "Juntas y comités" },
    ]);
    expect(parsed.shareholders.map((holder) => [holder.name, holder.direct])).toEqual([
      ["SOCIO INVENTADO SL", "60,00"],
      ["OTRA PERSONA FICTICIA", "40,00"],
    ]);
    expect(parsed.auditor).toBe("Auditores Imaginarios SLP");
    expect(parsed.banks).toEqual(["0000 - BANCO DE MENTIRA"]);
  });

  it("warns when the balance does not add up or the CIF is missing", async () => {
    const rows = syntheticRows.map((row) => (row[1] === "Total activo" ? ["", "Total activo", null, "999.999,00", "130"] : row[0] === "Código NIF" ? [] : row));
    const result = await parseSabiWorkbook(syntheticWorkbook(rows));
    expect(result.ok && result.report.warnings).toEqual(
      expect.arrayContaining(["No se ha encontrado el Código NIF en el archivo.", "En 2024 el total activo no cuadra con el total pasivo."]),
    );
  });
});

describe("mapSabiReport", () => {
  it("maps SABI lines onto the ficha so EBITDA and totals match SABI", async () => {
    const mapping = mapSabiReport(await report());
    const latest = mapping.years[0]!;
    const d = latest.data;
    expect(d.salesCents).toBe(20_000_000);
    expect(d.otherOperatingIncomeCents).toBe(1_000_000);
    expect(d.suppliesCents).toBe(-6_000_000);
    expect(d.staffCostsCents).toBe(-8_000_000);
    expect(d.amortizationCents).toBe(-1_000_000);
    const ebitda = d.salesCents! + d.otherOperatingIncomeCents! + d.suppliesCents! + d.staffCostsCents! + d.otherOperatingCostsCents!;
    expect(ebitda).toBe(4_000_000);
    expect(ebitda + d.amortizationCents!).toBe(3_000_000);
    expect(d.nonCurrentLiabilitiesCents).toBe(3_000_000);
    expect(d.currentAssetsCents! + d.nonCurrentAssetsCents!).toBe(15_000_000);
    expect(d.equityCents! + d.currentLiabilitiesCents! + d.nonCurrentLiabilitiesCents!).toBe(15_000_000);
    expect(mapping.project).toMatchObject({
      legalName: "EMPRESA FICTICIA DE PRUEBAS SL",
      foundedYear: 2000,
      revenueCents: 20_000_000,
      ebitdaCents: 4_000_000,
      netIncomeCents: 2_100_000,
      headcountRange: "band_11_20",
      principalCnae: "69.20",
      secondaryCnaes: ["82.99"],
    });
  });

  it("keeps figures above 21,4 M€ now that money columns are BIGINT", async () => {
    const parsed = await report();
    parsed.years[0]!.money.sales = 3_000_000_000;
    const mapping = mapSabiReport(parsed);
    expect(mapping.years[0]?.data.salesCents).toBe(3_000_000_000);
    expect(mapping.warnings).toEqual([]);
  });

  it("fills the remaining ficha lines SABI can answer", async () => {
    const parsed = await report();
    const { project, years } = mapSabiReport(parsed);
    const data = years[0]!.data;
    expect(project.legalForm).toBe(parsed.identity.legalForm);
    expect(project.audited).toBe(parsed.auditor ? true : null);
    expect(project.shareholderNames).toEqual(parsed.shareholders.map((holder) => holder.name));
    expect(project.opexCents).toBe(Math.abs((data.suppliesCents ?? 0) + (data.staffCostsCents ?? 0) + (data.otherOperatingCostsCents ?? 0)));
    expect(years[0]!.employees).toBe(parsed.years[0]!.employees);
  });
});

describe("SABI helpers", () => {
  it("drops SABI's own filing status from the accounts format", () => {
    expect(accountsFormatOf("Pendiente de tratamiento · PYME PGC 2007")).toBe("PYME PGC 2007");
    expect(accountsFormatOf("Abreviado PGC 2007")).toBe("Abreviado PGC 2007");
    expect(accountsFormatOf(null)).toBeNull();
  });

  it("only turns a clean 100 % shareholder split into the capital donut", async () => {
    const parsed = await report();
    const holder = { name: "A", country: null, type: "I", total: null, infoDate: null };
    expect(capitalSplit({ ...parsed, shareholders: [{ ...holder, direct: "60,00" }, { ...holder, direct: "40,00" }] })).toEqual([6000, 4000]);
    expect(capitalSplit({ ...parsed, shareholders: [{ ...holder, direct: ">50,00" }, { ...holder, direct: "8,10" }] })).toBeNull();
    expect(capitalSplit({ ...parsed, shareholders: [{ ...holder, direct: "60,00" }] })).toBeNull();
  });
});
