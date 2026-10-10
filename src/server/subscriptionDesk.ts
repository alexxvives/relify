import { z } from "zod";
import { billingCopy } from "@/lib/billing-copy";
import { readSiteUrl } from "@/lib/env";
import { formatEur } from "@/lib/money";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { syncSubscription } from "@/server/fulfillCheckout";
import { integrationLabel, stripeClient } from "@/server/stripe";
import type Stripe from "stripe";

export type SubscriptionInvoice = {
  id: string;
  date: string;
  amount: string;
  href: string | null;
};

export type SubscriptionDesk =
  | { kind: "none" }
  | { kind: "granted"; planLabel: string }
  | {
      kind: "stripe";
      planLabel: string;
      canceling: boolean;
      whenLabel: string;
      card: string | null;
      email: string;
      invoices: SubscriptionInvoice[];
    };

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

function longDate(unix: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(unix * 1000));
}

function planLabel(plan: string): string {
  if (plan === "limited") {
    return billingCopy.limitedName;
  }

  if (plan === "unlimited") {
    return billingCopy.unlimitedName;
  }

  return billingCopy.freeName;
}

function cardLabel(method: Stripe.PaymentMethod | string | null): string | null {
  if (!method || typeof method === "string" || !method.card) {
    return null;
  }

  const brand = method.card.brand;
  const name = brand.length > 0 ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Tarjeta";
  return `${name} ···· ${method.card.last4}`;
}

export async function loadSubscriptionDesk(userId: string, email: string): Promise<SubscriptionDesk> {
  const row = await prisma.billingCustomer.findUnique({
    where: { userId },
    select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (!row || row.plan === "none" || !row.stripeSubscriptionId) {
    if (row && row.plan !== "none") {
      return { kind: "granted", planLabel: planLabel(row.plan) };
    }

    return { kind: "none" };
  }

  const stripe = stripeClient();

  if (stripe === null) {
    return { kind: "granted", planLabel: planLabel(row.plan) };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(row.stripeSubscriptionId, {
      expand: ["default_payment_method"],
    });
    const item = subscription.items.data[0];
    const renews = item ? longDate(item.current_period_end) : "";
    const listed = await stripe.invoices.list({ customer: row.stripeCustomerId, limit: 8 });
    const customer = await stripe.customers.retrieve(row.stripeCustomerId);
    const billingEmail = customer.deleted ? email : (customer.email ?? email);

    return {
      kind: "stripe",
      planLabel: planLabel(row.plan),
      canceling: subscription.cancel_at_period_end,
      whenLabel: renews,
      card: cardLabel(subscription.default_payment_method),
      email: billingEmail,
      invoices: listed.data.flatMap((invoice) => {
        if (!invoice.id || (invoice.status !== "paid" && invoice.status !== "open")) {
          return [];
        }

        const cents = invoice.amount_paid > 0 ? invoice.amount_paid : invoice.amount_due;
        return [
          {
            id: invoice.id,
            date: longDate(invoice.created),
            amount: formatEur(cents),
            href: invoice.hosted_invoice_url ?? null,
          },
        ];
      }),
    };
  } catch {
    return { kind: "granted", planLabel: planLabel(row.plan) };
  }
}

async function ownedSubscription(userId: string): Promise<{ stripe: NonNullable<ReturnType<typeof stripeClient>>; customerId: string; subscriptionId: string } | null> {
  const stripe = stripeClient();
  const row = await prisma.billingCustomer.findUnique({
    where: { userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (stripe === null || !row?.stripeSubscriptionId) {
    return null;
  }

  return { stripe, customerId: row.stripeCustomerId, subscriptionId: row.stripeSubscriptionId };
}

export async function setSubscriptionCancel(user: CurrentUser, cancel: boolean): Promise<{ ok: true } | { ok: false; message: string }> {
  const owned = await ownedSubscription(user.id);

  if (!owned) {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  try {
    const updated = await owned.stripe.subscriptions.update(owned.subscriptionId, { cancel_at_period_end: cancel });
    await syncSubscription(updated);
    return { ok: true };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function updateBillingEmail(user: CurrentUser, email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = emailSchema.safeParse(email);
  const owned = await ownedSubscription(user.id);

  if (!parsed.success || !owned) {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  try {
    await owned.stripe.customers.update(owned.customerId, { email: parsed.data });
    return { ok: true };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startCardSetup(user: CurrentUser): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const owned = await ownedSubscription(user.id);

  if (!owned) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = readSiteUrl().origin;

  try {
    const session = await owned.stripe.checkout.sessions.create({
      mode: "setup",
      customer: owned.customerId,
      client_reference_id: user.id,
      locale: "es",
      currency: "eur",
      success_url: `${origin}/premium/suscripcion?setup_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium/suscripcion`,
      integration_identifier: integrationLabel("releva_card"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function applyCardSetup(userId: string, sessionId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const owned = await ownedSubscription(userId);

  if (!owned || !sessionId.startsWith("cs_")) {
    return { ok: false, message: billingCopy.stripeFailed };
  }

  try {
    const session = await owned.stripe.checkout.sessions.retrieve(sessionId, { expand: ["setup_intent"] });
    const intent = session.setup_intent;

    if (!intent || typeof intent === "string" || session.client_reference_id !== userId) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    const method = intent.payment_method;
    const paymentMethod = typeof method === "string" ? method : method?.id;

    if (!paymentMethod) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    await owned.stripe.customers.update(owned.customerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });
    await owned.stripe.subscriptions.update(owned.subscriptionId, { default_payment_method: paymentMethod });
    return { ok: true };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}
