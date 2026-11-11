import { prisma } from "@/server/db";
import { fulfillCheckout, syncSubscription } from "@/server/fulfillCheckout";
import { assertPaymentsEnabled } from "@/server/int-guards";
import { logRouteError } from "@/lib/route-error";
import { readStripeWebhookSecret, stripeClient } from "@/server/stripe";
import type Stripe from "stripe";

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await fulfillCheckout(event.data.object.id);
    return;
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object);
  }
}

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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) {
    return new Response("ok");
  }

  try {
    await handleStripeEvent(event);
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (error) {
    logRouteError("stripe-webhook", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok");
}
