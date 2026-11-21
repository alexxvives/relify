import type { AdvisorServiceId } from "./advisor-profile";

/** Engagement service ids (what the client asked for) → the advisor profile's service types (their published prices). */
const serviceTypeOf: Record<string, AdvisorServiceId> = {
  "due-diligence": "DUE_DILIGENCE",
  valuation: "COMPANY_VALUATION",
  legal: "LEGAL_CONSULTING",
  tax: "TAX_CONSULTING",
  "business-plan": "BUSINESS_PLAN",
  labor: "LABOR_CONSULTING",
};

export type AgreedAdvisorFee = { cents: number; fixed: boolean };

/**
 * S43 (Alex): the fee to close an encargo comes from the advisor's own published prices (Mis servicios) for the
 * services the client hired: the sum of each service's "desde" price. `fixed` when every one is a single price
 * (desde = hasta); a range, or a variable / success part agreed with the client, is when the advisor edits it.
 * Null when a hired service has no published price (the advisor types the amount, as before).
 */
export function agreedAdvisorFee(
  services: readonly string[],
  offers: readonly { serviceType: AdvisorServiceId; priceFromCents: number; priceToCents: number }[],
): AgreedAdvisorFee | null {
  if (services.length === 0) {
    return null;
  }

  let cents = 0;
  let fixed = true;

  for (const service of services) {
    const type = serviceTypeOf[service];
    const offer = type ? offers.find((row) => row.serviceType === type) : undefined;

    if (!offer || offer.priceFromCents <= 0) {
      return null;
    }

    cents += offer.priceFromCents;
    fixed = fixed && offer.priceFromCents === offer.priceToCents;
  }

  return { cents, fixed };
}
