import { requestOrigin } from "@/lib/server/request-origin";
import {
  ADVISOR_INBOX_NET_CENTS,
  SELLER_LISTING_NET_CENTS,
  advisorDepositCents,
  planNetCents,
} from "@/lib/billing";
import { engagementCopy } from "@/lib/engagement-copy";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { isIntEnvironment } from "@/lib/int-env";
import { integrationLabel, stripeClient } from "@/lib/server/stripe";
import {
  catalogLineItem,
  createCheckoutSession,
  stripeLookupKeys,
  taxableCheckoutFields,
} from "@/lib/server/stripe-checkout";
import type Stripe from "stripe";

export type CheckoutStart =
  { ok: true; url: string } | { ok: false; message: string };

function intCheckoutCustomText(): Pick<Stripe.Checkout.SessionCreateParams, "custom_text"> {
  if (!isIntEnvironment()) {
    return {};
  }
  return {
    custom_text: {
      submit: {
        message: "Modo prueba. Relify INT usa Stripe TEST: no se cobra de verdad.",
      },
    },
  };
}

function isStripeCustomerId(id: string): boolean {
  return id.startsWith("cus_");
}

async function customerId(user: CurrentUser): Promise<string | null> {
  const stripe = stripeClient();

  if (stripe === null) {
    return null;
  }

  const existing = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (existing && isStripeCustomerId(existing.stripeCustomerId)) {
    try {
      const customer = await stripe.customers.retrieve(
        existing.stripeCustomerId,
      );

      if (!customer.deleted) {
        return existing.stripeCustomerId;
      }
    } catch {
      // Seed rows and admin grants can store placeholder ids; replace them at checkout.
    }
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: user.id },
    });

    if (existing) {
      await prisma.billingCustomer.update({
        where: { userId: user.id },
        data: { stripeCustomerId: customer.id },
      });
    } else {
      await prisma.billingCustomer.create({
        data: {
          userId: user.id,
          stripeCustomerId: customer.id,
          plan: "none",
        },
      });
    }

    return customer.id;
  } catch {
    return null;
  }
}

export async function startBuyerCheckout(
  user: CurrentUser,
  plan: "limited" | "unlimited",
  options: { cancelPath?: string } = {},
): Promise<CheckoutStart> {
  const current = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (current && current.plan !== "none") {
    return { ok: true, url: `${await requestOrigin()}/premium/suscripcion` };
  }

  const stripe = stripeClient();

  if (stripe === null || user.role !== "investor") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = await requestOrigin();

  try {
    const lookupKey =
      plan === "limited" ? stripeLookupKeys.buyerLimitedMonthly : stripeLookupKeys.buyerUnlimitedMonthly;
    const lineItem = await catalogLineItem(stripe, lookupKey, {
      currency: "eur",
      unit_amount: planNetCents(plan),
      tax_behavior: "exclusive",
      recurring: { interval: "month" },
      product_data: {
        name: plan === "limited" ? "Relify Individual" : "Relify Empresa",
      },
    });
    const session = await createCheckoutSession(stripe, {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      locale: "es",
      line_items: [lineItem],
      metadata: { kind: "buyer_plan", plan, userId: user.id },
      subscription_data: {
        metadata: { kind: "buyer_plan", plan, userId: user.id },
      },
      success_url: `${origin}/premium?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${options.cancelPath ?? "/premium"}`,
      ...taxableCheckoutFields(),
      ...intCheckoutCustomText(),
      integration_identifier: integrationLabel("Relify_buyer"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startListingCheckout(
  user: CurrentUser,
  projectId: string,
  intent: "add" | "publish" = "publish",
): Promise<CheckoutStart> {
  const stripe = stripeClient();

  if (stripe === null || user.role !== "seller") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const origin = await requestOrigin();
  const successPath = intent === "add" ? "/mi-empresa/detalles" : "/mi-empresa";

  try {
    const lineItem = await catalogLineItem(stripe, stripeLookupKeys.sellerListingOnce, {
      currency: "eur",
      unit_amount: SELLER_LISTING_NET_CENTS,
      tax_behavior: "exclusive",
      product_data: { name: "Relify ficha de empresa" },
    });
    const session = await createCheckoutSession(stripe, {
      mode: "payment",
      customer,
      client_reference_id: user.id,
      locale: "es",
      line_items: [lineItem],
      invoice_creation: { enabled: true },
      metadata: { kind: "seller_listing", userId: user.id, projectId, intent },
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${successPath}`,
      ...taxableCheckoutFields(),
      ...intCheckoutCustomText(),
      integration_identifier: integrationLabel("Relify_listing"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startAdvisorInboxCheckout(
  user: CurrentUser,
  returnPath = "/mandatos/encargos",
): Promise<CheckoutStart> {
  const back = /^\/mandatos\/encargos(\/[A-Za-z0-9_-]+)?$/.test(returnPath)
    ? returnPath
    : "/mandatos/encargos";
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

  const origin = await requestOrigin();

  try {
    const lineItem = await catalogLineItem(stripe, stripeLookupKeys.advisorInboxMonthly, {
      currency: "eur",
      unit_amount: ADVISOR_INBOX_NET_CENTS,
      tax_behavior: "exclusive",
      recurring: { interval: "month" },
      product_data: { name: "Relify bandeja asesor" },
    });
    const session = await createCheckoutSession(stripe, {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      locale: "es",
      line_items: [lineItem],
      metadata: { kind: "advisor_inbox", userId: user.id },
      subscription_data: {
        metadata: { kind: "advisor_inbox", userId: user.id },
      },
      success_url: `${origin}${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${back}`,
      ...taxableCheckoutFields(),
      ...intCheckoutCustomText(),
      integration_identifier: integrationLabel("Relify_inbox"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}

export async function startAdvisorDepositCheckout(
  user: CurrentUser,
  engagementId: string,
): Promise<CheckoutStart> {
  const stripe = stripeClient();

  if (stripe === null || user.role !== "advisor") {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id: engagementId, advisorId: user.id },
    select: {
      id: true,
      depositPaidAt: true,
      declinedAt: true,
      project: { select: { codename: true, askingPriceCents: true } },
    },
  });

  if (!row || row.declinedAt) {
    return { ok: false, message: engagementCopy.missing };
  }

  const subscription = await prisma.billingCustomer.findUnique({
    where: { userId: user.id },
    select: { advisorInbox: true },
  });

  if (subscription?.advisorInbox !== true) {
    return { ok: false, message: engagementCopy.subscriptionRequired };
  }

  const origin = await requestOrigin();
  const back = `${origin}/mandatos/encargos/${row.id}`;

  if (row.depositPaidAt) {
    return { ok: true, url: back };
  }

  const customer = await customerId(user);

  if (customer === null) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

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
            unit_amount: advisorDepositCents(row.project.askingPriceCents),
            product_data: { name: `Depósito Relify · ${row.project.codename}` },
          },
        },
      ],
      metadata: {
        kind: "advisor_deposit",
        userId: user.id,
        engagementId: row.id,
      },
      success_url: `${back}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
      ...intCheckoutCustomText(),
      integration_identifier: integrationLabel("Relify_deposit"),
    });

    if (!session.url) {
      return { ok: false, message: billingCopy.stripeFailed };
    }

    return { ok: true, url: session.url };
  } catch {
    return { ok: false, message: billingCopy.stripeFailed };
  }
}
