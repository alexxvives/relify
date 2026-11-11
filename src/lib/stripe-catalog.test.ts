import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  stripeCatalog,
  stripeLookupKeys,
  stripeWebhookEvents,
  stripeWebhookPath,
} from "./stripe-catalog";
import { ADVISOR_INBOX_NET_CENTS, LIMITED_NET_CENTS, SELLER_LISTING_NET_CENTS, UNLIMITED_NET_CENTS } from "./billing";

describe("Stripe catalog lookup keys", () => {
  it("keeps stable lookup_keys and exclusive net amounts", () => {
    expect(stripeLookupKeys.buyerLimitedMonthly).toBe("relify_buyer_limited_monthly");
    expect(stripeLookupKeys.buyerUnlimitedMonthly).toBe("relify_buyer_unlimited_monthly");
    expect(stripeLookupKeys.sellerListingOnce).toBe("relify_seller_listing_once");
    expect(stripeLookupKeys.advisorInboxMonthly).toBe("relify_advisor_inbox_monthly");
    expect(stripeCatalog.map((row) => row.unitAmount)).toEqual([
      LIMITED_NET_CENTS,
      UNLIMITED_NET_CENTS,
      SELLER_LISTING_NET_CENTS,
      ADVISOR_INBOX_NET_CENTS,
    ]);
  });

  it("bootstrap script refuses live keys and missing keys", () => {
    const live = spawnSync(process.execPath, ["scripts/stripe-bootstrap-test.mjs"], {
      encoding: "utf8",
      env: { ...process.env, STRIPE_SECRET_KEY: "sk_live_not_allowed", INT_STRIPE_SECRET_KEY: "" },
    });
    expect(live.status).not.toBe(0);
    expect(`${live.stdout}${live.stderr}`).toMatch(/live/i);

    const missing = spawnSync(process.execPath, ["scripts/stripe-bootstrap-test.mjs"], {
      encoding: "utf8",
      env: { ...process.env, STRIPE_SECRET_KEY: "", INT_STRIPE_SECRET_KEY: "" },
    });
    expect(missing.status).not.toBe(0);
  });

  it("lists the webhook events INT and prod must subscribe", () => {
    expect(stripeWebhookPath).toBe("/api/stripe/webhook");
    expect(stripeWebhookEvents).toEqual([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ]);
  });
});
