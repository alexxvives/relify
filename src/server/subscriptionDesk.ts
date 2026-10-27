import { requestOrigin } from "@/server/requestOrigin";
import { z } from "zod";
import { billingCopy } from "@/lib/billing-copy";
import { grossCents, planNetCents } from "@/lib/billing";
import { formatEur } from "@/lib/money";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { syncSubscription } from "@/server/fulfillCheckout";
import { integrationLabel, stripeClient } from "@/server/stripe";
import type Stripe from "stripe";

export type SubscriptionInvoice = {
  id: string;
  number: string;
  date: string;
  amount: string;
  status: "paid" | "open";
  href: string | null;
  pdf: string | null;
};

export type SubscriptionDesk =
  | { kind: "none" }
  | { kind: "granted"; planLabel: string }
  | {
      kind: "stripe";
      planLabel: string;
      statusLabel: string;
      amountLabel: string | null;
      canceling: boolean;
      whenLabel: string;
      periodStart: string;
      card: string | null;
      cardBrand: string | null;
      cardLast4: string | null;
      cardExpires: string | null;
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

function cardLabel(method: Stripe.PaymentMethod | string | null): { label: string; brand: string; last4: string; expires: string } | null {
  if (!method || typeof method === "string" || !method.card) {
    return null;
  }

  const brand = method.card.brand;
  const name = brand.length > 0 ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Tarjeta";
  const month = String(method.card.exp_month).padStart(2, "0");
  return {
    label: `${name} ···· ${method.card.last4}`,
    brand: name,
    last4: method.card.last4,
    expires: `${month}/${method.card.exp_year}`,
  };
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Activa",
    past_due: "Pago pendiente",
    canceled: "Cancelada",
    unpaid: "Impagada",
    trialing: "En prueba",
    incomplete: "Incompleta",
    incomplete_expired: "Caducada",
    paused: "En pausa",
  };

  return labels[status] ?? status;
}

function paidOrOpen(status: string): "paid" | "open" | null {
  if (status === "paid" || status === "open") {
    return status;
  }

  return null;
}

function amountLabel(item: Stripe.SubscriptionItem | undefined): string | null {
  const cents = item?.price.unit_amount;

  if (typeof cents !== "number") {
    return null;
  }

  const interval = item?.price.recurring?.interval;
  const period = interval === "year" ? "año" : interval === "month" ? "mes" : null;
  return period ? `${formatEur(cents)}/${period}` : formatEur(cents);
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
    const started = item ? longDate(item.current_period_start) : "";
    const listed = await stripe.invoices.list({ customer: row.stripeCustomerId, limit: 12 });
    const customer = await stripe.customers.retrieve(row.stripeCustomerId);
    const billingEmail = customer.deleted ? email : (customer.email ?? email);
    const card = cardLabel(subscription.default_payment_method);

    return {
      kind: "stripe",
      planLabel: planLabel(row.plan),
      statusLabel: statusLabel(subscription.status),
      amountLabel: amountLabel(item),
      canceling: subscription.cancel_at_period_end,
      whenLabel: renews,
      periodStart: started,
      card: card?.label ?? null,
      cardBrand: card?.brand ?? null,
      cardLast4: card?.last4 ?? null,
      cardExpires: card?.expires ?? null,
      email: billingEmail,
      invoices: listed.data.flatMap((invoice) => {
        const status = invoice.status ? paidOrOpen(invoice.status) : null;

        if (!invoice.id || !status) {
          return [];
        }

        const cents = invoice.amount_paid > 0 ? invoice.amount_paid : invoice.amount_due;
        return [
          {
            id: invoice.id,
            number: invoice.number ?? invoice.id,
            date: longDate(invoice.created),
            amount: formatEur(cents),
            status,
            href: invoice.hosted_invoice_url ?? null,
            pdf: invoice.invoice_pdf ?? null,
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

/** Switches an active buyer subscription between plans in place; Stripe prorates the difference on the next invoice. */
export async function changeSubscriptionPlan(user: CurrentUser, plan: "limited" | "unlimited"): Promise<{ ok: true } | { ok: false; message: string }> {
  const owned = await ownedSubscription(user.id);

  if (!owned) {
    return { ok: false, message: billingCopy.grantedChange };
  }

  try {
    const current = await owned.stripe.subscriptions.retrieve(owned.subscriptionId);
    const item = current.items.data[0];

    if (!item || current.metadata.kind !== "buyer_plan" || current.status !== "active") {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    if (current.metadata.plan === plan) {
      return { ok: true };
    }

    const product = typeof item.price.product === "string" ? item.price.product : item.price.product.id;
    await owned.stripe.products.update(product, { name: plan === "limited" ? "Relify 3 matches" : "Relify matches ilimitados" });
    const updated = await owned.stripe.subscriptions.update(owned.subscriptionId, {
      items: [{ id: item.id, price_data: { currency: "eur", product, unit_amount: grossCents(planNetCents(plan)), recurring: { interval: "month" } } }],
      metadata: { ...current.metadata, plan },
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
    });
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

  const origin = await requestOrigin();

  try {
    const session = await owned.stripe.checkout.sessions.create({
      mode: "setup",
      customer: owned.customerId,
      client_reference_id: user.id,
      locale: "es",
      currency: "eur",
      success_url: `${origin}/premium/suscripcion?setup_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium/suscripcion`,
      integration_identifier: integrationLabel("Relify_card"),
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
