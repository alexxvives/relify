import { advisorCopy } from "./advisor-copy";
import { corporateIsComplete, formatAdvisorEuros, readStoredServices, type AdvisorServiceId } from "./advisor-profile";
import { advisorSectorName } from "./advisor-sectors";

export const publicAdvisorFields = ["userId", "businessName", "sectors", "services"] as const;

export type PublicAdvisorCard = {
  id: string;
  businessName: string;
  sectors: string[];
  services: { title: string; range: string }[];
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

export function toPublicAdvisorCard(profile: {
  userId: string;
  businessName: string;
  nif: string;
  postalCode: string;
  description: string;
  sectors: string[];
  services: unknown;
}): PublicAdvisorCard | null {
  if (!advisorIsListed(profile)) {
    return null;
  }

  const services = readStoredServices(profile.services).map((service) => ({
    title: advisorCopy.serviceTypes[service.serviceType],
    range: `${formatAdvisorEuros(service.priceFromCents)} – ${formatAdvisorEuros(service.priceToCents)}`,
  }));

  return {
    id: profile.userId,
    businessName: profile.businessName,
    sectors: profile.sectors.map((sector) => advisorSectorName(sector)),
    services,
  };
}

export function publicAdvisorCardKeys(card: PublicAdvisorCard): string[] {
  return Object.keys(card);
}

export function advisorServiceTitle(id: AdvisorServiceId): string {
  return advisorCopy.serviceTypes[id];
}

export { privateAdvisorFields };
