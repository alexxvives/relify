import { advisorDepositCents } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";
import { stripeClient } from "@/server/stripe";
import type Stripe from "stripe";

export type FulfillResult = { ok: true } | { ok: false; message: string };

function planFromMetadata(metadata: Stripe.Metadata | null): "limited" | "unlimited" | null {
  const plan = metadata?.plan;

  if (plan === "limited" || plan === "unlimited") {
    return plan;
  }

  return null;
}

function periodOf(subscription: Stripe.Subscription): { start: Date; end: Date } | null {
  const item = subscription.items.data[0];

  if (!item) {
    return null;
  }

  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}

async function applyAdvisorInbox(userId: string, customerId: string, subscription: Stripe.Subscription): Promise<void> {
  const active = subscription.status === "active" || subscription.status === "trialing";

  await prisma.billingCustomer.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      plan: "none",
      advisorInbox: active,
      advisorSubscriptionId: subscription.id,
    },
    update: {
      advisorInbox: active,
      advisorSubscriptionId: subscription.id,
    },
  });
}

async function applySubscription(userId: string, customerId: string, subscription: Stripe.Subscription): Promise<void> {
  const plan = subscription.status === "active" ? planFromMetadata(subscription.metadata) : null;
  const period = periodOf(subscription);

  await prisma.billingCustomer.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      plan: plan ?? "none",
      stripeSubscriptionId: subscription.id,
      periodStart: period?.start ?? null,
      periodEnd: period?.end ?? null,
    },
    update: {
      stripeCustomerId: customerId,
      plan: plan ?? "none",
      stripeSubscriptionId: subscription.id,
      periodStart: period?.start ?? null,
      periodEnd: period?.end ?? null,
    },
  });
}

async function applyListing(ownerId: string, projectId: string, sessionId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true, status: true },
  });

  if (!project) {
    return;
  }

  await prisma.listingPayment.upsert({
    where: { stripeCheckoutSessionId: sessionId },
    create: {
      id: sessionId,
      userId: ownerId,
      projectId,
      stripeCheckoutSessionId: sessionId,
    },
    update: {},
  });

  if (project.status === "draft") {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "pending" },
    });
  }
}

export async function fulfillCheckout(sessionId: string, expectedUserId?: string): Promise<FulfillResult> {
  const stripe = stripeClient();

  if (stripe === null || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return { ok: false, message: billingCopy.stripeMissing };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  const userId = session.metadata?.userId ?? session.client_reference_id ?? "";

  if (expectedUserId !== undefined && userId !== expectedUserId) {
    return { ok: false, message: billingCopy.unpaid };
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!customerId || userId === "") {
    return { ok: false, message: billingCopy.unpaid };
  }

  if (session.mode === "subscription") {
    const subscription = session.subscription;

    if (session.status !== "complete" || !subscription || typeof subscription === "string") {
      return { ok: false, message: billingCopy.unpaid };
    }

    if (session.metadata?.kind === "advisor_inbox" || subscription.metadata.kind === "advisor_inbox") {
      await applyAdvisorInbox(userId, customerId, subscription);
      return { ok: true };
    }

    await applySubscription(userId, customerId, subscription);
    return { ok: true };
  }

  const listingKind = session.metadata?.kind;
  if (
    session.mode === "payment" &&
    session.payment_status === "paid" &&
    (listingKind === "advisor_listing" || listingKind === "seller_listing")
  ) {
    const projectId = session.metadata?.projectId ?? "";

    if (projectId === "") {
      return { ok: false, message: billingCopy.unpaid };
    }

    await applyListing(userId, projectId, session.id);
    return { ok: true };
  }

  if (session.mode === "payment" && session.payment_status === "paid" && session.metadata?.kind === "advisor_deposit") {
    const engagementId = session.metadata.engagementId ?? "";

    if (engagementId === "") {
      return { ok: false, message: billingCopy.unpaid };
    }

    const applied = await applyAdvisorDeposit(userId, engagementId, session);

    return applied ? { ok: true } : { ok: false, message: engagementCopy.depositFailed };
  }

  return { ok: false, message: billingCopy.unpaid };
}

async function applyAdvisorDeposit(userId: string, engagementId: string, session: Stripe.Checkout.Session): Promise<boolean> {
  const row = await prisma.advisoryEngagement.findFirst({
    where: { id: engagementId, advisorId: userId },
    select: {
      id: true,
      depositPaidAt: true,
      declinedAt: true,
      requesterId: true,
      client: true,
      project: { select: { codename: true, askingPriceCents: true } },
    },
  });

  if (!row || row.declinedAt || session.amount_total !== advisorDepositCents(row.project.askingPriceCents)) {
    return false;
  }

  if (row.depositPaidAt) {
    return true;
  }

  await prisma.advisoryEngagement.update({
    where: { id: row.id },
    data: {
      depositPaidAt: new Date(),
      depositCents: advisorDepositCents(row.project.askingPriceCents),
      depositSessionId: session.id,
    },
  });
  await recordNotification({
    userId: row.requesterId,
    title: "Solicitud aceptada",
    body: `Un asesor ha aceptado tu solicitud para ${row.project.codename}.`,
    href: row.client === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });

  return true;
}

export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  if (subscription.metadata.kind === "advisor_inbox") {
    const userId = subscription.metadata.userId;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    if (!userId) {
      const existing = await prisma.billingCustomer.findUnique({
        where: { advisorSubscriptionId: subscription.id },
        select: { userId: true, stripeCustomerId: true },
      });

      if (!existing) {
        return;
      }

      await applyAdvisorInbox(existing.userId, existing.stripeCustomerId, subscription);
      return;
    }

    await applyAdvisorInbox(userId, customerId, subscription);
    return;
  }

  const userId = subscription.metadata.userId;

  if (!userId) {
    const existing = await prisma.billingCustomer.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { userId: true, stripeCustomerId: true },
    });

    if (!existing) {
      return;
    }

    await applySubscription(existing.userId, existing.stripeCustomerId, subscription);
    return;
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  await applySubscription(userId, customerId, subscription);
}
