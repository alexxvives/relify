import {
  ADVISOR_INBOX_NET_CENTS,
  LIMITED_NET_CENTS,
  SELLER_LISTING_NET_CENTS,
  UNLIMITED_NET_CENTS,
} from "./billing";

/** Stable Stripe Price lookup_keys. Bootstrap and Checkout share these names. */
export const stripeLookupKeys = {
  buyerLimitedMonthly: "relify_buyer_limited_monthly",
  buyerUnlimitedMonthly: "relify_buyer_unlimited_monthly",
  sellerListingOnce: "relify_seller_listing_once",
  advisorInboxMonthly: "relify_advisor_inbox_monthly",
} as const;

export type StripeLookupKey = (typeof stripeLookupKeys)[keyof typeof stripeLookupKeys];

export const stripeCatalog = [
  {
    lookupKey: stripeLookupKeys.buyerLimitedMonthly,
    name: "Relify Individual",
    description: "Plan comprador: 3 matches al mes.",
    unitAmount: LIMITED_NET_CENTS,
    recurring: "month" as const,
  },
  {
    lookupKey: stripeLookupKeys.buyerUnlimitedMonthly,
    name: "Relify Empresa",
    description: "Plan comprador: matches ilimitados.",
    unitAmount: UNLIMITED_NET_CENTS,
    recurring: "month" as const,
  },
  {
    lookupKey: stripeLookupKeys.sellerListingOnce,
    name: "Relify ficha de empresa",
    description: "Alta o empresa adicional (149 € netos). IVA lo calcula Stripe Tax.",
    unitAmount: SELLER_LISTING_NET_CENTS,
    recurring: null,
  },
  {
    lookupKey: stripeLookupKeys.advisorInboxMonthly,
    name: "Relify bandeja asesor",
    description: "Suscripción de asesor.",
    unitAmount: ADVISOR_INBOX_NET_CENTS,
    recurring: "month" as const,
  },
] as const;

export const stripeWebhookEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export const stripeWebhookPath = "/api/stripe/webhook";
