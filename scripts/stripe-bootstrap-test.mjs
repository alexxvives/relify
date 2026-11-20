#!/usr/bin/env node
/**
 * Idempotently creates Relify TEST Products/Prices with lookup_keys.
 * Refuses live keys. Usage:
 *   STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-bootstrap-test.mjs
 *   INT_STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-bootstrap-test.mjs
 */
import Stripe from "stripe";

const CATALOG = [
  {
    lookup_key: "relify_buyer_limited_monthly",
    name: "Relify Individual",
    description: "Plan comprador: 3 matches al mes.",
    unit_amount: 2000,
    recurring: { interval: "month" },
  },
  {
    lookup_key: "relify_buyer_unlimited_monthly",
    name: "Relify Empresa",
    description: "Plan comprador: matches ilimitados.",
    unit_amount: 9900,
    recurring: { interval: "month" },
  },
  {
    lookup_key: "relify_seller_listing_once",
    name: "Relify ficha de empresa",
    description: "Alta o empresa adicional (149 € netos).",
    unit_amount: 14900,
    recurring: null,
  },
  {
    lookup_key: "relify_advisor_inbox_monthly",
    name: "Suscripción asesor",
    description: "Suscripción de asesor.",
    unit_amount: 4900,
    recurring: { interval: "month" },
  },
];

function testSecret() {
  const key = (process.env.STRIPE_SECRET_KEY || process.env.INT_STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    console.error("Set STRIPE_SECRET_KEY or INT_STRIPE_SECRET_KEY to a sk_test_ / rk_test_ key.");
    process.exit(1);
  }
  if (key.includes("_live_") || key.startsWith("sk_live_") || key.startsWith("rk_live_") || key.startsWith("pk_live_")) {
    console.error("Refusing a live Stripe key. This script is TEST-only.");
    process.exit(1);
  }
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    console.error("Expected a TEST secret (sk_test_ or rk_test_).");
    process.exit(1);
  }
  return key;
}

async function ensurePrice(stripe, spec) {
  const existing = await stripe.prices.list({ lookup_keys: [spec.lookup_key], active: true, limit: 1 });
  const found = existing.data[0];
  if (found) {
    return { created: false, productId: typeof found.product === "string" ? found.product : found.product.id, price: found };
  }
  const product = await stripe.products.create({
    name: spec.name,
    description: spec.description,
    metadata: { relify_lookup: spec.lookup_key },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: spec.unit_amount,
    lookup_key: spec.lookup_key,
    transfer_lookup_key: true,
    tax_behavior: "exclusive",
    ...(spec.recurring ? { recurring: spec.recurring } : {}),
    metadata: { relify_lookup: spec.lookup_key },
  });
  return { created: true, productId: product.id, price };
}

async function main() {
  const stripe = new Stripe(testSecret());
  const rows = [];
  for (const spec of CATALOG) {
    const result = await ensurePrice(stripe, spec);
    rows.push({
      lookup_key: spec.lookup_key,
      product_id: result.productId,
      price_id: result.price.id,
      unit_amount: result.price.unit_amount,
      created: result.created,
    });
  }
  console.log(JSON.stringify({ mode: "test", prices: rows }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
