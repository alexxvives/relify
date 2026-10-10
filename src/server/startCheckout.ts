import { ADVISOR_INBOX_NET_CENTS, SELLER_LISTING_NET_CENTS, grossCents, planNetCents } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import { readSiteUrl } from "@/lib/env";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { integrationLabel, stripeClient } from "@/server/stripe";

export type CheckoutStart = { ok: true; url: string } | { ok: false; message: string };

async function customerId(user: CurrentUser): Promise<string | null> {
  const stripe = stripeClient();

  if (stripe === null) {
    return null;
  }

  const existing = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (existing) {
    return existing.stripeCustomerId;
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: user.id },
    });

    await prisma.billingCustomer.create({
      data: {
        userId: user.id,
        stripeCustomerId: customer.id,
        plan: "none",
      },
    });

    return customer.id;
  } catch {
    return null;
  }
}

export async function startBuyerCheckout(user: CurrentUser, plan: "limited" | "unlimited"): Promise<CheckoutStart> {
  const current = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (current && current.plan !== "none") {
    return { ok: true, url: `${readSiteUrl().origin}/premium/suscripcion` };
  }

  const stripe = stripeClient();

  if (stripe === null || user.role !== "investor") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = readSiteUrl().origin;

  try {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    locale: "es",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: grossCents(planNetCents(plan)),
          recurring: { interval: "month" },
          product_data: {
            name: plan === "limited" ? "Releva 3 matches" : "Releva matches ilimitados",
          },
        },
      },
    ],
    metadata: { kind: "buyer_plan", plan, userId: user.id },
    subscription_data: { metadata: { kind: "buyer_plan", plan, userId: user.id } },
    success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/premium`,
    integration_identifier: integrationLabel("releva_buyer"),
  });

  if (!session.url) {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startListingCheckout(user: CurrentUser, projectId: string): Promise<CheckoutStart> {
  const stripe = stripeClient();

  if (stripe === null || user.role !== "seller") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = readSiteUrl().origin;

  try {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    client_reference_id: user.id,
    locale: "es",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: grossCents(SELLER_LISTING_NET_CENTS),
          product_data: { name: "Releva empresa adicional" },
        },
      },
    ],
    metadata: { kind: "seller_listing", userId: user.id, projectId },
    success_url: `${origin}/mi-empresa?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/mi-empresa`,
    integration_identifier: integrationLabel("releva_listing"),
  });

  if (!session.url) {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startAdvisorInboxCheckout(user: CurrentUser): Promise<CheckoutStart> {
  const stripe = stripeClient();

  if (stripe === null || user.role !== "advisor") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const current = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { advisorInbox: true },
  });

  if (current?.advisorInbox) {
    return { ok: false, message: billingCopy.advisorAlready };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = readSiteUrl().origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      locale: "es",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: grossCents(ADVISOR_INBOX_NET_CENTS),
            recurring: { interval: "month" },
            product_data: { name: "Releva bandeja de encargos" },
          },
        },
      ],
      metadata: { kind: "advisor_inbox", userId: user.id },
      subscription_data: { metadata: { kind: "advisor_inbox", userId: user.id } },
      success_url: `${origin}/mandatos?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/mandatos`,
      integration_identifier: integrationLabel("releva_inbox"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

