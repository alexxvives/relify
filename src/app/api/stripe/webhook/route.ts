import { fulfillCheckout, syncSubscription } from "@/server/fulfillCheckout";
import { assertPaymentsEnabled } from "@/server/int-guards";
import { readStripeWebhookSecret, stripeClient } from "@/server/stripe";

export async function POST(request: Request): Promise<Response> {
  try {
    assertPaymentsEnabled();
  } catch {
    return new Response("Payments disabled", { status: 503 });
  }

  const stripe = stripeClient();
  const secret = readStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");

  if (stripe === null || secret === null || signature === null) {
    return new Response("Webhook not configured", { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);

    if (event.type === "checkout.session.completed") {
      await fulfillCheckout(event.data.object.id);
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object);
    }
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  return new Response("ok");
}
