import { advisorCopy } from "./advisor-copy";
import { corporateIsComplete, formatAdvisorEuros, readStoredOperations, readStoredServices, type AdvisorServiceId } from "./advisor-profile";
import { advisorSectorName } from "./advisor-sectors";

export const publicAdvisorFields = ["userId", "description", "sectors", "services", "cases"] as const;

export type PublicAdvisorCase = {
  sector: string;
  closedOn: string;
  value: string;
};

export type PublicAdvisorCard = {
  id: string;
  description: string;
  sectors: string[];
  services: { title: string; range: string; fromCents: number }[];
  cases: PublicAdvisorCase[];
};

export const advisorPriceBands = ["any", "under-3", "mid", "over-6"] as const;

export type AdvisorPriceBand = (typeof advisorPriceBands)[number];

const privateAdvisorFields = ["nif", "postalCode", "email", "closedOperations"] as const;

export function advisorIsListed(profile: {
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: string[];
  services: unknown;
}): boolean {
  return corporateIsComplete(profile) && readStoredServices(profile.services).length > 0;
}

function caseDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(parsed);
}

export function toPublicAdvisorCard(profile: {
  userId: string;
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: string[];
  services: unknown;
  closedOperations?: unknown;
}): PublicAdvisorCard | null {
  if (!advisorIsListed(profile)) {
    return null;
  }

  const services = readStoredServices(profile.services).map((service) => ({
    title: advisorCopy.serviceTypes[service.serviceType],
    range: `${formatAdvisorEuros(service.priceFromCents)} – ${formatAdvisorEuros(service.priceToCents)}`,
    fromCents: service.priceFromCents,
  }));
  const cases = readStoredOperations(profile.closedOperations).map((operation) => ({
    sector: advisorSectorName(operation.sectorId),
    closedOn: caseDate(operation.closingDate),
    value: formatAdvisorEuros(operation.enterpriseValueCents),
  }));

  return {
    id: profile.userId,
    description: profile.description.trim(),
    sectors: profile.sectors.map((sector) => advisorSectorName(sector)),
    services,
    cases,
  };
}

function priceInBand(cents: number, band: AdvisorPriceBand): boolean {
  if (band === "under-3") {
    return cents <= 300_000;
  }
  if (band === "mid") {
    return cents > 300_000 && cents <= 600_000;
  }
  if (band === "over-6") {
    return cents > 600_000;
  }
  return true;
}

export function filterPublicAdvisors(
  advisors: readonly PublicAdvisorCard[],
  input: { query: string; sector: string; service: string; price: AdvisorPriceBand },
): PublicAdvisorCard[] {
  const query = input.query.trim().toLocaleLowerCase("es-ES");

  return advisors.filter((advisor) => {
    const haystack = [...advisor.sectors, ...advisor.services.map((service) => service.title)]
      .join(" ")
      .toLocaleLowerCase("es-ES");
    if (query.length > 0 && !haystack.includes(query)) {
      return false;
    }
    if (input.sector.length > 0 && !advisor.sectors.includes(input.sector)) {
      return false;
    }
    const services = advisor.services.filter((service) => input.service.length === 0 || service.title === input.service);
    if (services.length === 0) {
      return false;
    }
    return input.price === "any" || services.some((service) => priceInBand(service.fromCents, input.price));
  });
}

export function publicAdvisorCardKeys(card: PublicAdvisorCard): string[] {
  return Object.keys(card);
}

export function advisorServiceTitle(id: AdvisorServiceId): string {
  return advisorCopy.serviceTypes[id];
}

export { privateAdvisorFields };
