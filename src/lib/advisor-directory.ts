import { formatDecimal } from "./money";
import { advisorCopy } from "./advisor-copy";
import { corporateIsComplete, formatAdvisorEuros, readStoredOperations, readStoredServices, type AdvisorServiceId } from "./advisor-profile";
import { advisorSectorShort } from "./advisor-sectors";

export const publicAdvisorFields = ["userId", "description", "sectors", "services", "cases"] as const;

export type PublicAdvisorCase = {
  sector: string;
  closedOn: string;
  value: string;
};

export function casesForVerifiedCloses(count: number): PublicAdvisorCase[] {
  return Array.from({ length: count }, () => ({
    sector: "Relify",
    closedOn: "—",
    value: "—",
  }));
}

export type PublicAdvisorCard = {
  id: string;
  /** Public business name the advisor lists under. */
  name: string;
  description: string;
  sectors: string[];
  services: { title: string; range: string; fromCents: number }[];
  cases: PublicAdvisorCase[];
  verified?: boolean;
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

/**
 * S29b (Alex): the profile keeps a from/to range, but cards show where the price starts ("Desde 1.500 €"),
 * or the single price when both ends match.
 */
export function advisorPriceLabel(fromCents: number, toCents: number): string {
  if (fromCents === toCents) {
    return formatAdvisorEuros(fromCents);
  }
  return `Desde ${formatAdvisorEuros(Math.min(fromCents, toCents))}`;
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
  verifiedAt?: Date | null;
}): PublicAdvisorCard | null {
  if (!advisorIsListed(profile)) {
    return null;
  }

  const services = readStoredServices(profile.services).map((service) => ({
    title: advisorCopy.serviceTypes[service.serviceType],
    range: advisorPriceLabel(service.priceFromCents, service.priceToCents),
    fromCents: service.priceFromCents,
  }));
  const cases = readStoredOperations(profile.closedOperations).map((operation) => ({
    sector: advisorSectorShort(operation.sectorId),
    closedOn: caseDate(operation.closingDate),
    value: formatAdvisorEuros(operation.enterpriseValueCents),
  }));

  return {
    id: profile.userId,
    name: profile.businessName.trim(),
    verified: profile.verifiedAt != null,
    description: profile.description.trim(),
    sectors: profile.sectors.map((sector) => advisorSectorShort(sector)),
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

/** Pseudo clean messages added to every advisor so one slip in a short chat does not sink them. */
export const reliabilityPrior = 5;
export const leakWeights = { email: 1, phone: 1, offPlatform: 0.6 } as const;
/** Points for 0, 1, 2, 3, 4 and 5+ verified closes: each extra close is worth less. */
export const casePoints = [0, 14, 24, 31, 36, 40] as const;
export const scoreMax = { cases: 40, verified: 15, services: 20, description: 15, sectors: 10 } as const;

type ReliabilityParts = {
  reliability: number;
  messageCount: number;
  emailMessages: number;
  phoneMessages: number;
  offPlatformMessages: number;
};

function reliabilityParts(bodies: readonly string[]): ReliabilityParts {
  let penalty = 0;
  let emailMessages = 0;
  let phoneMessages = 0;
  let offPlatformMessages = 0;

  for (const body of bodies) {
    const leak = advisorContactLeak(body);
    emailMessages += Number(leak.email);
    phoneMessages += Number(leak.phone);
    offPlatformMessages += Number(leak.offPlatform);
    penalty += Math.min(1, Number(leak.email) * leakWeights.email + Number(leak.phone) * leakWeights.phone + Number(leak.offPlatform) * leakWeights.offPlatform);
  }

  const reliability = Math.round(Math.max(0, 100 * (1 - penalty / (bodies.length + reliabilityPrior))));

  return { reliability, messageCount: bodies.length, emailMessages, phoneMessages, offPlatformMessages };
}

/**
 * Share of the advisor's chat messages that stay on the platform, as 0-100.
 * Each message costs up to 1 (email 1, phone 1, off-platform hint 0.6, capped at 1),
 * divided by the message count plus {@link reliabilityPrior} clean pseudo messages.
 */
export function advisorReliability(bodies: readonly string[]): number {
  return reliabilityParts(bodies).reliability;
}

export type AdvisorScoreBreakdown = {
  cases: number;
  caseCount: number;
  verified: number;
  isVerified: boolean;
  services: number;
  serviceCount: number;
  description: number;
  descriptionLength: number;
  sectors: number;
  sectorCount: number;
  quality: number;
  reliability: number;
  messageCount: number;
  emailMessages: number;
  phoneMessages: number;
  offPlatformMessages: number;
  email: boolean;
  phone: boolean;
  offPlatform: boolean;
  rank: number;
};

function sectorPoints(count: number): number {
  if (count === 0) {
    return 0;
  }

  if (count <= 3) {
    return 10;
  }

  return count <= 6 ? 6 : 3;
}

export function advisorScoreBreakdown(card: PublicAdvisorCard, bodies: readonly string[]): AdvisorScoreBreakdown {
  const caseCount = card.cases.length;
  const serviceCount = card.services.length;
  const descriptionLength = card.description.length;
  const sectorCount = card.sectors.length;
  const isVerified = card.verified === true;
  const cases = casePoints[Math.min(caseCount, casePoints.length - 1)] ?? 0;
  const verified = isVerified ? scoreMax.verified : 0;
  const services = Math.min(serviceCount, 4) * 5;
  const description = descriptionLength >= 180 ? 15 : descriptionLength >= 50 ? 9 : 0;
  const sectors = sectorPoints(sectorCount);
  const quality = cases + verified + services + description + sectors;
  const parts = reliabilityParts(bodies);

  return {
    cases,
    caseCount,
    verified,
    isVerified,
    services,
    serviceCount,
    description,
    descriptionLength,
    sectors,
    sectorCount,
    quality,
    ...parts,
    email: parts.emailMessages > 0,
    phone: parts.phoneMessages > 0,
    offPlatform: parts.offPlatformMessages > 0,
    rank: Math.round(quality * parts.reliability) / 100,
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
  return formatDecimal(value);
}

export function advisorRankJustification(place: number, total: number, breakdown: AdvisorScoreBreakdown): string {
  const leaks = [
    breakdown.emailMessages > 0 ? `un correo en ${breakdown.emailMessages} ${breakdown.emailMessages === 1 ? "mensaje" : "mensajes"}` : "",
    breakdown.phoneMessages > 0 ? `un teléfono en ${breakdown.phoneMessages} ${breakdown.phoneMessages === 1 ? "mensaje" : "mensajes"}` : "",
    breakdown.offPlatformMessages > 0
      ? `una pista para seguir fuera en ${breakdown.offPlatformMessages} ${breakdown.offPlatformMessages === 1 ? "mensaje" : "mensajes"}`
      : "",
  ].filter((item) => item.length > 0);
  const reliability =
    leaks.length === 0
      ? "La fiabilidad es 100 porque sus mensajes no sacan el contacto de la plataforma."
      : `La fiabilidad es ${scoreLabel(breakdown.reliability)} de 100: de ${breakdown.messageCount} mensajes aparece ${spanishList(leaks)}.`;

  return `Puesto ${place} de ${total}. La nota de ficha es ${scoreLabel(breakdown.quality)} de 100: ${scoreLabel(breakdown.cases)} por ${breakdown.caseCount} casos cerrados, ${scoreLabel(breakdown.verified)} por verificación, ${scoreLabel(breakdown.services)} por ${breakdown.serviceCount} servicios, ${scoreLabel(breakdown.description)} por la descripción y ${scoreLabel(breakdown.sectors)} por ${breakdown.sectorCount} sectores. ${reliability} El ranking es ${scoreLabel(breakdown.rank)}: esa nota multiplicada por la fiabilidad.`;
}

export function advisorRank(card: PublicAdvisorCard, reliability: number): number {
  return Math.round(advisorQuality(card) * reliability) / 100;
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
