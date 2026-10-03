import { centsToEuroInput, emptyCompanyDraft, type CompanyDraftInput } from "./company-draft";
import type { HeadcountRangeId } from "./company-profile";
import { normalizeCif } from "./spanish-cif";

const aliases = ["Alba", "Bruma", "Cauce", "Delta", "Estela", "Grao", "Lima", "Nieve", "Olmo", "Ria"] as const;

export type RegistryCompany = {
  cif: string;
  legalName: string;
  address: string;
  region: string;
  codename: string;
  foundedYear: number | null;
  description: string;
  principalCnae: string;
  secondaryCnaes: string[];
  headcount: HeadcountRangeId | null;
  revenueCents: number | null;
  ebitdaCents: number | null;
  adjustedEbitdaCents: number | null;
  statementYear: number | null;
};

export function anonymousCodename(cif: string): string {
  let total = 0;

  for (const char of normalizeCif(cif)) {
    total += char.charCodeAt(0);
  }

  const name = aliases[total % aliases.length];

  if (name === undefined) {
    return "Proyecto Alba";
  }

  return `Proyecto ${name}`;
}

const fixtureCompany: RegistryCompany = {
  cif: "B12345674",
  legalName: "Obrador Ficticio Norte S.L.",
  address: "Calle Ficticia 12, 28001 Madrid",
  region: "Madrid",
  codename: anonymousCodename("B12345674"),
  foundedYear: 2014,
  description: "Obrador de pan y bollería. Vende en tienda propia y a cafeterías del barrio.",
  principalCnae: "10.71",
  secondaryCnaes: ["10.72"],
  headcount: "band_6_10",
  revenueCents: 185_000_000,
  ebitdaCents: 24_000_000,
  adjustedEbitdaCents: 21_000_000,
  statementYear: 2024,
};

export function lookupFixtureCompany(cif: string): RegistryCompany | null {
  if (normalizeCif(cif) !== fixtureCompany.cif) {
    return null;
  }

  return fixtureCompany;
}

export function draftFromRegistry(record: RegistryCompany): CompanyDraftInput {
  const draft = emptyCompanyDraft();
  draft.legalName = record.legalName;
  draft.address = record.address;
  draft.codename = record.codename;
  draft.region = record.region;
  draft.foundedYear = record.foundedYear === null ? "" : String(record.foundedYear);
  draft.description = record.description;
  draft.principalCnae = record.principalCnae;
  draft.secondaryCnaes = [...record.secondaryCnaes];
  draft.revenue = record.revenueCents === null ? "" : centsToEuroInput(record.revenueCents);
  draft.ebitda = record.ebitdaCents === null ? "" : centsToEuroInput(record.ebitdaCents);
  draft.adjustedEbitda = record.adjustedEbitdaCents === null ? "" : centsToEuroInput(record.adjustedEbitdaCents);
  draft.headcount = record.headcount ?? "";

  if (record.statementYear !== null && record.revenueCents !== null) {
    const yearText = String(record.statementYear);
    const sales = centsToEuroInput(record.revenueCents);
    const match = draft.closedYears.find((year) => year.year === yearText);
    const slot = match ?? draft.closedYears[2];

    if (slot) {
      slot.year = yearText;
      slot.sales = sales;
    }
  }

  return draft;
}
