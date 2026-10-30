import { describe, expect, it } from "vitest";
import { ProjectScalarFieldEnum, ProjectYearScalarFieldEnum } from "../../generated/prisma/internal/prismaNamespaceBrowser";
import { syntheticRows, syntheticWorkbook } from "./__fixtures__/synthetic";
import { sabiYearDetailFields } from "./detail-fields";
import { sabiMoneyLabels, type SabiMoneyKey } from "./labels";
import { mapSabiReport, mapSabiYear, sabiCompanyDetail, sabiExtraOf, sabiYearDetail } from "./mapping";
import { parseSabiWorkbook } from "./parse";

const identityRows = [["Empresa privada"], [null, null, "Empresas en el grupo corporativo", 4]];

const extraRows = [
  ["Estado auditoría por año:"],
  ["2024\u00a0cuenta:"],
  [null, "Fecha de cierre:", "31/12/2024"],
  [null, "Opinión auditores:", "Favorable"],
  [null, "Nombre del auditor:", "Auditores Imaginarios SLP"],
  ["Informaciones bursátiles"],
  ["No hay datos bursátiles para esta empresa."],
];

async function report() {
  const result = await parseSabiWorkbook(syntheticWorkbook([syntheticRows[0]!, ...identityRows, ...syntheticRows.slice(1), [], ...extraRows]));

  if (!result.ok) {
    throw new Error(result.code);
  }

  return result.report;
}

describe("t62: nothing from SABI is dropped", () => {
  it("stores every SABI money line in a ficha column or a detail column", () => {
    const year = {
      year: 2024,
      closingOn: "2024-12-31",
      months: 12,
      basis: null,
      ratios: {},
      employees: null,
      money: Object.fromEntries(Object.keys(sabiMoneyLabels).map((key, index) => [key, (index + 1) * 1000])) as Record<SabiMoneyKey, number>,
    };
    const stored = new Set<number | string | null>([...Object.values(mapSabiYear(year).data), ...Object.values(sabiYearDetail(year))]);
    const derivedOnly: SabiMoneyKey[] = ["staffCosts", "depreciation"];
    const missing = (Object.keys(sabiMoneyLabels) as SabiMoneyKey[]).filter(
      (key) => !stored.has(year.money[key]) && !stored.has(-year.money[key]) && !derivedOnly.includes(key),
    );
    expect(missing).toEqual([]);
    expect(new Set(sabiYearDetailFields.map((field) => field.column)).size).toBe(sabiYearDetailFields.length);
  });

  it("reads company type, group size and the audit status per year", async () => {
    const parsed = await report();
    expect(parsed.identity.companyType).toBe("Empresa privada");
    expect(parsed.identity.groupCompanyCount).toBe(4);
    expect(parsed.audits).toEqual([
      {
        year: 2024,
        closingOn: "2024-12-31",
        opinion: "Favorable",
        auditorName: "Auditores Imaginarios SLP",
        auditorCode: null,
        fields: { "Fecha de cierre": "31/12/2024", "Opinión auditores": "Favorable", "Nombre del auditor": "Auditores Imaginarios SLP" },
      },
    ]);
  });

  it("keeps the whole sheet and the years outside the ficha in sabi_extra", async () => {
    const parsed = await report();
    const company = sabiCompanyDetail(parsed);
    expect(company.companyType).toBe("Empresa privada");
    expect(company.shareholdings).toHaveLength(2);
    const extra = sabiExtraOf(parsed, []);
    expect(extra.olderYears).toHaveLength(parsed.years.length);
    const texts = extra.sheet.flatMap(([, cells]) => cells.map(([, text]) => text));
    expect(texts).toContain("No hay datos bursátiles para esta empresa.");
    expect(sabiExtraOf(parsed, mapSabiReport(parsed).years.map((year) => year.year)).olderYears).toHaveLength(0);
  });
});

describe("SABI detail keys are real columns", () => {
  it("every company and year detail key exists on the Prisma models", async () => {
    const parsed = await report();
    const projectCols = new Set<string>(Object.values(ProjectScalarFieldEnum));
    const yearCols = new Set<string>(Object.values(ProjectYearScalarFieldEnum));
    expect(Object.keys(sabiCompanyDetail(parsed)).filter((key) => !projectCols.has(key))).toEqual([]);
    expect(Object.keys(sabiYearDetail(parsed.years[0]!)).filter((key) => !yearCols.has(key))).toEqual([]);
  });
});
