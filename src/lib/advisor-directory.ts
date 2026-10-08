import { advisorCopy } from "./advisor-copy";
import { corporateIsComplete, formatAdvisorEuros, readStoredOperations, readStoredServices, type AdvisorServiceId } from "./advisor-profile";
import { advisorSectorName } from "./advisor-sectors";

export const publicAdvisorFields = ["userId", "businessName", "sectors", "services", "cases"] as const;

export type PublicAdvisorCase = {
  title: string;
  sector: string;
  closedOn: string;
  value: string;
};

export type PublicAdvisorCard = {
  id: string;
  businessName: string;
  sectors: string[];
  services: { title: string; range: string }[];
  cases: PublicAdvisorCase[];
};

const privateAdvisorFields = ["nif", "postalCode", "description", "email", "closedOperations"] as const;

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
  }));
  const cases = readStoredOperations(profile.closedOperations).map((operation) => ({
    title: operation.name,
    sector: advisorSectorName(operation.sectorId),
    closedOn: caseDate(operation.closingDate),
    value: formatAdvisorEuros(operation.enterpriseValueCents),
  }));

  return {
    id: profile.userId,
    businessName: profile.businessName,
    sectors: profile.sectors.map((sector) => advisorSectorName(sector)),
    services,
    cases,
  };
}

export function publicAdvisorCardKeys(card: PublicAdvisorCard): string[] {
  return Object.keys(card);
}

export function advisorServiceTitle(id: AdvisorServiceId): string {
  return advisorCopy.serviceTypes[id];
}

export { privateAdvisorFields };
