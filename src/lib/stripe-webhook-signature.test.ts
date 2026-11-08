import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { readStripeWebhookSecret } from "../server/stripe";
import { assertPaymentsEnabled } from "../server/int-guards";

describe("Stripe webhook signature branch", () => {
  const secret = "whsec_test_local_signature_only";
  const payload = JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_1" } },
  });

  it("constructEvent accepts a valid HMAC and rejects a tampered payload", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    const event = Stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.id).toBe("evt_test_1");
    expect(event.type).toBe("checkout.session.completed");

    expect(() =>
      Stripe.webhooks.constructEvent(`${payload} `, header, secret),
    ).toThrow();
    expect(() =>
      Stripe.webhooks.constructEvent(payload, "t=1,v1=deadbeef", secret),
    ).toThrow();
  });

  it("does not treat a missing whsec_ secret as configured", () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_MODE = "test";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(readStripeWebhookSecret()).toBeNull();
    process.env.STRIPE_WEBHOOK_SECRET = "not-a-whsec";
    expect(readStripeWebhookSecret()).toBeNull();
    if (previous === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previous;
    }
  });

  it("INT payments stay fail-closed even after a valid signature would parse", () => {
    const previous = process.env.INT_ENVIRONMENT;
    process.env.INT_ENVIRONMENT = "true";
    expect(() => assertPaymentsEnabled()).toThrow(/disabled in INT/);
    if (previous === undefined) {
      delete process.env.INT_ENVIRONMENT;
    } else {
      process.env.INT_ENVIRONMENT = previous;
    }
  });
});
