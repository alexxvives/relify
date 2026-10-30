import type { SabiMapping } from "./mapping";
import type { SabiReport } from "./parse";

/** t67: the preview is built from the parsed report alone, so the browser can show it without a round trip. */
export type SabiPreviewYear = {
  year: number;
  months: number | null;
  salesCents: number | null;
  ebitdaCents: number | null;
  netResultCents: number | null;
  totalAssetsCents: number | null;
  equityCents: number | null;
  employees: number | null;
  replacesSeller: boolean;
};

export type SabiPreview = {
  fileName: string;
  legalName: string | null;
  cif: string | null;
  legalForm: string | null;
  address: string | null;
  incorporatedOn: string | null;
  employees: number | null;
  cnae: string | null;
  yearsInFile: number;
  years: SabiPreviewYear[];
  directors: number;
  shareholders: number;
  warnings: string[];
};

/** What the preview needs to know about the company the file goes into. */
export type SabiPreviewTarget = { cif: string; sellerClosedYears: number[] };

export function sabiPreviewWarnings(report: SabiReport, mapping: SabiMapping, target: SabiPreviewTarget): { warnings: string[]; sellerYears: Set<number> } {
  const warnings = [...report.warnings, ...mapping.warnings];
  const fileCif = report.identity.cif;
  const projectCif = target.cif.trim().toUpperCase();

  if (fileCif && projectCif && fileCif !== projectCif) {
    warnings.unshift(`El CIF del archivo (${fileCif}) no coincide con el de la empresa (${projectCif}).`);
  }

  const imported = new Set(mapping.years.map((year) => year.year));
  const sellerYears = new Set(target.sellerClosedYears.filter((year) => imported.has(year)));

  if (sellerYears.size > 0) {
    warnings.push(`Se sustituyen las cifras que ya había para ${[...sellerYears].sort().join(", ")}.`);
  }

  if (report.unmappedLabels.length > 0) {
    warnings.push(`Líneas del archivo que no se usan: ${report.unmappedLabels.slice(0, 8).join(", ")}${report.unmappedLabels.length > 8 ? "…" : ""}.`);
  }

  return { warnings, sellerYears };
}

export function buildSabiPreview(report: SabiReport, mapping: SabiMapping, target: SabiPreviewTarget, fileName: string): SabiPreview {
  const { warnings, sellerYears } = sabiPreviewWarnings(report, mapping, target);
  const byYear = new Map(report.years.map((year) => [year.year, year]));
  const cnae = report.codes.cnae2009?.primary[0];

  return {
    fileName: fileName.slice(0, 200),
    legalName: report.identity.legalName,
    cif: report.identity.cif,
    legalForm: report.identity.legalForm,
    address: mapping.project.address,
    incorporatedOn: report.identity.incorporatedOn,
    employees: report.identity.employees,
    cnae: cnae ? `${cnae.code} · ${cnae.description}` : null,
    yearsInFile: report.years.length,
    years: mapping.years.map((year) => {
      const source = byYear.get(year.year);
      return {
        year: year.year,
        months: source?.months ?? null,
        salesCents: year.data.salesCents,
        ebitdaCents: year.ebitdaCents,
        netResultCents: year.data.netResultCents,
        totalAssetsCents: source?.money.totalAssets ?? null,
        equityCents: year.data.equityCents,
        employees: year.employees,
        replacesSeller: sellerYears.has(year.year),
      };
    }),
    directors: report.directors.length,
    shareholders: report.shareholders.length,
    warnings,
  };
}
