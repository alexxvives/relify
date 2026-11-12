import type Stripe from "stripe";
import { stripeLookupKeys, type StripeLookupKey } from "@/lib/stripe-catalog";

export { stripeLookupKeys };

function isAutomaticTaxError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  return message.includes("automatic tax") || message.includes("automatic_tax") || message.includes("tax");
}

/** B2B ES/EU VAT: Stripe Tax + tax ID collection. Needs an ES Tax registration in the Dashboard. */
export function taxableCheckoutFields(): Pick<
  Stripe.Checkout.SessionCreateParams,
  "automatic_tax" | "tax_id_collection" | "billing_address_collection" | "customer_update"
> {
  return {
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
  };
}

export async function catalogLineItem(
  stripe: Stripe,
  lookupKey: StripeLookupKey,
  fallback: Stripe.Checkout.SessionCreateParams.LineItem.PriceData,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  try {
    const listed = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = listed.data[0];
    if (price) {
      return { quantity: 1, price: price.id };
    }
  } catch {
    // Catalog missing in this Stripe account; fall back to inline price_data.
  }
  return { quantity: 1, price_data: fallback };
}

export async function createCheckoutSession(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (error) {
    if (!params.automatic_tax?.enabled || !isAutomaticTaxError(error)) {
      throw error;
    }
    const { automatic_tax, tax_id_collection, billing_address_collection, customer_update, ...rest } = params;
    void automatic_tax;
    void tax_id_collection;
    void billing_address_collection;
    void customer_update;
    return stripe.checkout.sessions.create(rest);
  }
}
