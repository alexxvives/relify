import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { getIntStripeSecretKey, getIntStripeWebhookSecret, isIntEnvironment } from "../lib/int-env";
import { assertPaymentsEnabled } from "./int-guards";

let client: Stripe | null = null;

export type StripeMode = "test" | "live";

export function stripeMode(): StripeMode {
  if (isIntEnvironment()) {
    return "test";
  }
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}

function liveSecretKey(): string | null {
  const key = process.env.STRIPE_LIVE_SECRET_KEY?.trim() ?? "";

  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) {
    return key;
  }

  return null;
}

export function readStripeSecret(): string | null {
  if (isIntEnvironment()) {
    return getIntStripeSecretKey();
  }

  if (stripeMode() === "live") {
    return liveSecretKey();
  }

  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) {
    return key;
  }

  return null;
}

export function readStripeWebhookSecret(): string | null {
  if (isIntEnvironment()) {
    return getIntStripeWebhookSecret();
  }

  const secret =
    stripeMode() === "live"
      ? (process.env.STRIPE_LIVE_WEBHOOK_SECRET?.trim() ?? "")
      : (process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "");
  return secret.startsWith("whsec_") ? secret : null;
}

export function stripeClient(): Stripe | null {
  try {
    assertPaymentsEnabled();
  } catch {
    return null;
  }

  const key = readStripeSecret();

  if (key === null) {
    return null;
  }

  if (client === null) {
    client = new Stripe(key);
  }

  return client;
}

export function integrationLabel(name: string): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  let suffix = "";

  for (let index = 0; index < 8; index += 1) {
    const byte = bytes[index] ?? 0;
    suffix += alphabet[byte % alphabet.length];
  }

  return `${name}_${suffix}`;
}

let ivaRateId: string | null = null;

// Exclusive 21% IVA rate so Checkout shows net + IVA as separate lines (14900 + 3129 = 18029).
export async function spanishIvaRate(stripe: Stripe): Promise<string | null> {
  if (ivaRateId !== null) {
    return ivaRateId;
  }

  try {
    const rates = await stripe.taxRates.list({
      active: true,
      inclusive: false,
      limit: 100,
    });
    const existing = rates.data.find(
      (rate) => rate.metadata?.relify === "iva21" && rate.percentage === 21,
    );
    const rate =
      existing ??
      (await stripe.taxRates.create({
        display_name: "IVA",
        percentage: 21,
        inclusive: false,
        country: "ES",
        jurisdiction: "ES",
        metadata: { relify: "iva21" },
      }));
    ivaRateId = rate.id;
    return ivaRateId;
  } catch {
    return null;
  }
}
