import { advisorCopy } from "./advisor-copy";
import { corporateIsComplete, formatAdvisorEuros, readStoredOperations, readStoredServices, type AdvisorServiceId } from "./advisor-profile";
import { advisorSectorName } from "./advisor-sectors";

export const publicAdvisorFields = ["userId", "description", "sectors", "services", "cases"] as const;

export type PublicAdvisorCase = {
  sector: string;
  closedOn: string;
  value: string;
};

export function casesForVerifiedCloses(count: number): PublicAdvisorCase[] {
  return Array.from({ length: count }, () => ({
    sector: "Releva",
    closedOn: "—",
    value: "—",
  }));
}

export type PublicAdvisorCard = {
  id: string;
  description: string;
  sectors: string[];
  services: { title: string; range: string; fromCents: number }[];
  cases: PublicAdvisorCase[];
};

export const advisorMarketplaceSorts = ["recommended", "price-asc", "price-desc"] as const;

export type AdvisorMarketplaceSort = (typeof advisorMarketplaceSorts)[number];

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

const emailLeak = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const phoneLeak = /(?:\+34[\s.-]*)?(?:[6-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}/;
const offPlatformLeak =
  /whatsapp|telegram|ll[aá]mame|mi correo|mi e-?mail|mi m[oó]vil|mi tel[eé]fono|mi n[uú]mero|fuera de la plataforma|por privado|hablamos fuera/i;

export type AdvisorContactLeak = {
  email: boolean;
  phone: boolean;
  offPlatform: boolean;
};

export function advisorContactLeak(text: string): AdvisorContactLeak {
  return {
    email: emailLeak.test(text),
    phone: phoneLeak.test(text),
    offPlatform: offPlatformLeak.test(text),
  };
}

export function advisorMessageLeavesPlatform(text: string): boolean {
  const leak = advisorContactLeak(text);

  return leak.email || leak.phone || leak.offPlatform;
}

export function advisorReliability(bodies: readonly string[]): number {
  if (bodies.length === 0) {
    return 100;
  }

  const leak = advisorContactLeak(bodies.join("\n"));
  let score = 100;

  if (leak.email) {
    score -= 30;
  }

  if (leak.phone) {
    score -= 30;
  }

  if (leak.offPlatform) {
    score -= 25;
  }

  return Math.max(0, score);
}

export type AdvisorScoreBreakdown = {
  cases: number;
  caseCount: number;
  services: number;
  serviceCount: number;
  description: number;
  descriptionLength: number;
  sectors: number;
  sectorCount: number;
  quality: number;
  reliability: number;
  email: boolean;
  phone: boolean;
  offPlatform: boolean;
  rank: number;
};

export function advisorScoreBreakdown(card: PublicAdvisorCard, bodies: readonly string[]): AdvisorScoreBreakdown {
  const caseCount = card.cases.length;
  const serviceCount = card.services.length;
  const descriptionLength = card.description.length;
  const sectorCount = card.sectors.length;
  const cases = Math.min(caseCount, 4) * 16;
  const services = Math.min(serviceCount, 4) * 5;
  const description = descriptionLength >= 180 ? 12 : descriptionLength >= 50 ? 8 : 0;
  const sectors = sectorCount === 0 ? 0 : sectorCount <= 3 ? 8 : 3;
  const quality = cases + services + description + sectors;
  const leak = advisorContactLeak(bodies.join("\n"));
  const reliability = advisorReliability(bodies);

  return {
    cases,
    caseCount,
    services,
    serviceCount,
    description,
    descriptionLength,
    sectors,
    sectorCount,
    quality,
    reliability,
    email: leak.email,
    phone: leak.phone,
    offPlatform: leak.offPlatform,
    rank: quality * (reliability / 100),
  };
}

export function advisorQuality(card: PublicAdvisorCard): number {
  return advisorScoreBreakdown(card, []).quality;
}

function spanishList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function scoreLabel(value: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value);
}

export function advisorRankJustification(place: number, total: number, breakdown: AdvisorScoreBreakdown): string {
  const leaks = [
    breakdown.email ? "un correo" : "",
    breakdown.phone ? "un teléfono" : "",
    breakdown.offPlatform ? "una pista para seguir fuera" : "",
  ].filter((item) => item.length > 0);
  const reliability =
    leaks.length === 0
      ? "La fiabilidad es 100 porque sus mensajes no sacan el contacto de la plataforma."
      : `La fiabilidad baja a ${scoreLabel(breakdown.reliability)} porque en sus mensajes aparece ${spanishList(leaks)}.`;

  return `Puesto ${place} de ${total}. La nota de ficha es ${scoreLabel(breakdown.quality)}: ${scoreLabel(breakdown.cases)} por ${breakdown.caseCount} casos cerrados, ${scoreLabel(breakdown.services)} por ${breakdown.serviceCount} servicios, ${scoreLabel(breakdown.description)} por la descripción y ${scoreLabel(breakdown.sectors)} por ${breakdown.sectorCount} sectores. ${reliability} El ranking es ${scoreLabel(breakdown.rank)}: esa nota multiplicada por la fiabilidad.`;
}

export function advisorRank(card: PublicAdvisorCard, reliability: number): number {
  return advisorQuality(card) * (reliability / 100);
}

function startingPrice(card: PublicAdvisorCard): number {
  const prices = card.services.map((service) => service.fromCents);

  if (prices.length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.min(...prices);
}

export function filterPublicAdvisors(
  advisors: readonly PublicAdvisorCard[],
  input: { sector: string; service: string },
): PublicAdvisorCard[] {
  return advisors.filter((advisor) => {
    if (input.sector.length > 0 && !advisor.sectors.includes(input.sector)) {
      return false;
    }

    return advisor.services.some((service) => input.service.length === 0 || service.title === input.service);
  });
}

export function sortPublicAdvisors(
  advisors: readonly PublicAdvisorCard[],
  sort: AdvisorMarketplaceSort,
  reliabilityFor: (id: string) => number = () => 100,
): PublicAdvisorCard[] {
  const copy = [...advisors];

  if (sort === "price-asc" || sort === "price-desc") {
    const direction = sort === "price-asc" ? 1 : -1;
    copy.sort((left, right) => {
      const delta = startingPrice(left) - startingPrice(right);

      if (delta !== 0) {
        return delta * direction;
      }

      return left.id.localeCompare(right.id);
    });
    return copy;
  }

  copy.sort((left, right) => {
    const delta = advisorRank(right, reliabilityFor(right.id)) - advisorRank(left, reliabilityFor(left.id));

    if (delta !== 0) {
      return delta;
    }

    const cases = right.cases.length - left.cases.length;

    if (cases !== 0) {
      return cases;
    }

    return left.id.localeCompare(right.id);
  });

  return copy;
}

export function selectedEngagementCompany(companies: readonly { slug: string }[], requested: string | undefined): string {
  if (requested && companies.some((company) => company.slug === requested)) {
    return requested;
  }

  if (companies.length === 1) {
    return companies[0]?.slug ?? "";
  }

  return "";
}

export function publicAdvisorCardKeys(card: PublicAdvisorCard): string[] {
  return Object.keys(card);
}

export function advisorServiceTitle(id: AdvisorServiceId): string {
  return advisorCopy.serviceTypes[id];
}

export { privateAdvisorFields };
