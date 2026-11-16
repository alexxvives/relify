import type { SabiRegistry } from "@/lib/sabi/registry";
import type { SabiYear } from "@/lib/sabi/insights";
import { optionalEurosToCents } from "@/lib/company-draft";
import type { SabiCompanyDetailColumn, SabiYearDetailColumn } from "@/lib/sabi/detail-fields";
import type { SabiDetailForm } from "@/lib/server/sabi-detail";

const norm = (value: string) => value.trim().toLocaleLowerCase("es-ES").replace(/\s+/g, " ");

/**
 * t81: lines of "Datos registrales y detalle contable" that the admin report already shows above with
 * the same value. Only exact repeats are hidden, so the admin view loses no data.
 */
export function sabiDetailDuplicates(detail: SabiDetailForm, years: SabiYear[], registry: SabiRegistry | null): Set<SabiCompanyDetailColumn | SabiYearDetailColumn> {
  const hidden = new Set<SabiCompanyDetailColumn | SabiYearDetailColumn>();
  const company = detail.company;
  const directors = new Set((registry?.directors ?? []).map((person) => norm(person.name)));
  const auditors = new Set((registry?.audits ?? []).flatMap((audit) => (audit.auditorName ? [norm(audit.auditorName)] : [])));

  if (company.auditorName.trim() !== "" && auditors.has(norm(company.auditorName))) hidden.add("auditorName");
  if (company.president.trim() !== "" && directors.has(norm(company.president))) hidden.add("president");
  if (company.executiveDirector.trim() !== "" && directors.has(norm(company.executiveDirector))) hidden.add("executiveDirector");
  if (registry && company.shareholderCount !== "" && Number(company.shareholderCount) === registry.shareholdings.length) hidden.add("shareholderCount");
  if (registry && company.subsidiaryCount !== "" && Number(company.subsidiaryCount) === registry.subsidiaries.length) hidden.add("subsidiaryCount");

  const byYear = new Map(years.map((year) => [year.year, year]));
  const same = (column: SabiYearDetailColumn, pick: (year: SabiYear) => number | null) => {
    const filled = detail.years.filter((year) => year.values[column].trim() !== "");
    return filled.length > 0 && filled.every((year) => {
      const shown = byYear.get(year.year);
      return shown !== undefined && pick(shown) === optionalEurosToCents(year.values[column]);
    });
  };
  if (same("totalAssetsCents", (year) => year.totalAssetsCents)) hidden.add("totalAssetsCents");
  if (same("totalLiabilitiesAndEquityCents", (year) => year.totalAssetsCents)) hidden.add("totalLiabilitiesAndEquityCents");
  if (same("ebitdaCents", (year) => year.ebitdaCents)) hidden.add("ebitdaCents");
  if (same("workingCapitalCents", (year) => year.workingCapitalCents)) hidden.add("workingCapitalCents");
  if (same("operatingRevenueCents", (year) => year.revenueCents)) hidden.add("operatingRevenueCents");
  return hidden;
}
