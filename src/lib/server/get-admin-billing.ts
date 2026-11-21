import {
  ADVISOR_INBOX_NET_CENTS,
  SELLER_LISTING_NET_CENTS,
  grossCents,
  planNetCents,
} from "@/lib/billing";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { stripeMode } from "@/lib/server/stripe";

export type InvestorPlanCount = {
  plan: "none" | "limited" | "unlimited";
  count: number;
};

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeZone: "Europe/Madrid",
});

export type BillingEntry = {
  id: string;
  title: string;
  detail: string;
  amount: string;
  cents: number;
  at: string | null;
  /** S38: deposit rows only. null = not refunded yet. */
  refund?: { engagementId: string; status: string | null; reviewReady: boolean };
};

export type BillingBook = {
  id: string;
  title: string;
  total: string;
  count: number;
  entries: BillingEntry[];
};

export async function countInvestorPlans(): Promise<InvestorPlanCount[]> {
  const [investors, limited, unlimited] = await Promise.all([
    prisma.user.count({ where: { role: "investor" } }),
    prisma.billingCustomer.count({
      where: { plan: "limited", user: { role: "investor" } },
    }),
    prisma.billingCustomer.count({
      where: { plan: "unlimited", user: { role: "investor" } },
    }),
  ]);

  return [
    { plan: "none", count: Math.max(investors - limited - unlimited, 0) },
    { plan: "limited", count: limited },
    { plan: "unlimited", count: unlimited },
  ];
}

export type AdminBilling = {
  live: boolean;
  plans: InvestorPlanCount[];
  collected: string;
  recorded: string;
  books: BillingBook[];
};

function dated(value: Date | null): string {
  return value ? when.format(value) : "";
}

function asEntry(row: BillingEntry): BillingEntry {
  return row;
}

function stamp(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function getAdminBilling(
  user: CurrentUser,
): Promise<AdminBilling | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const [plans, listings, fees, engagements, deposits, customers] =
    await Promise.all([
      countInvestorPlans(),
      prisma.listingPayment.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          project: { select: { codename: true } },
          user: { select: { email: true } },
        },
      }),
      prisma.successFee.findMany({
        orderBy: { recordedAt: "desc" },
        select: {
          id: true,
          recordedAt: true,
          closedPriceCents: true,
          buyerNetCents: true,
          buyerVatCents: true,
          sellerNetCents: true,
          sellerVatCents: true,
          project: { select: { codename: true } },
        },
      }),
      prisma.advisoryEngagement.findMany({
        where: { platformNetCents: { not: null } },
        orderBy: { closedAt: "desc" },
        select: {
          id: true,
          closedAt: true,
          chargedCents: true,
          platformNetCents: true,
          platformVatCents: true,
          project: { select: { codename: true } },
        },
      }),
      prisma.advisoryEngagement.findMany({
        // S43: launch-waived acceptances (0 cents, no Checkout session) are not deposits and have nothing to refund.
        where: { depositPaidAt: { not: null }, depositCents: { gt: 0 } },
        orderBy: { depositPaidAt: "desc" },
        select: {
          id: true,
          depositPaidAt: true,
          depositCents: true,
          closedAt: true,
          client: true,
          requesterId: true,
          projectId: true,
          project: { select: { codename: true, successFee: { select: { id: true } } } },
        },
      }),
      prisma.billingCustomer.findMany({
        where: { OR: [{ plan: { not: "none" } }, { advisorInbox: true }] },
        select: {
          userId: true,
          plan: true,
          stripeSubscriptionId: true,
          periodStart: true,
          periodEnd: true,
          advisorInbox: true,
          advisorSubscriptionId: true,
          user: { select: { email: true } },
        },
      }),
    ]);
  const listingGross = grossCents(SELLER_LISTING_NET_CENTS);
  const listingTotal = listings.length * listingGross;
  const refunds = await prisma.depositRefund.findMany({
    where: { engagementId: { in: deposits.map((row) => row.id) } },
    select: { engagementId: true, status: true },
  });
  const refundStatus = new Map(refunds.map((row) => [row.engagementId, row.status]));
  // S39: admin refunds by hand; flag the deposits whose encargo closed, whose sale was recorded or whose buyer cancelled.
  const buyerDeposits = deposits.filter((row) => row.client === "investor");
  const cancelled = buyerDeposits.length
    ? await prisma.projectAccess.findMany({
        where: {
          cancelledAt: { not: null },
          OR: buyerDeposits.map((row) => ({ projectId: row.projectId, investorId: row.requesterId })),
        },
        select: { projectId: true, investorId: true },
      })
    : [];
  const cancelledKey = new Set(cancelled.map((row) => `${row.projectId}:${row.investorId}`));
  const reviewReady = (row: (typeof deposits)[number]) =>
    row.closedAt !== null ||
    row.project.successFee !== null ||
    (row.client === "investor" && cancelledKey.has(`${row.projectId}:${row.requesterId}`));
  const depositTotal = deposits.reduce((sum, row) => sum + row.depositCents, 0);
  const closeRows = fees.map((fee) => {
    const buyer = fee.buyerNetCents + fee.buyerVatCents;
    const seller = fee.sellerNetCents + fee.sellerVatCents;
    return {
      id: fee.id,
      title: fee.project.codename,
      detail: `${adminCopy.billingBuyer} ${formatEur(buyer)} · ${adminCopy.billingSeller} ${formatEur(seller)} · ${dated(fee.recordedAt)}`,
      amount: formatEur(buyer + seller),
      cents: buyer + seller,
      at: stamp(fee.recordedAt),
    };
  });
  const advisorRows = engagements.map((row) => {
    const cents = (row.platformNetCents ?? 0) + (row.platformVatCents ?? 0);
    const charged = row.chargedCents ?? 0;
    return {
      id: row.id,
      title: row.project.codename,
      detail: `${adminCopy.billingOn} ${formatEur(charged)}${row.closedAt ? ` · ${dated(row.closedAt)}` : ""}`,
      amount: formatEur(cents),
      cents,
      at: stamp(row.closedAt),
    };
  });
  const subscriptionRows = customers.flatMap((customer) => {
    const rows: BillingEntry[] = [];

    if (customer.plan === "limited" || customer.plan === "unlimited") {
      const subscribed = customer.stripeSubscriptionId !== null;
      const cents = subscribed ? grossCents(planNetCents(customer.plan)) : 0;
      rows.push({
        id: `${customer.userId}-plan`,
        title: customer.user.email,
        detail: subscribed
          ? `${adminCopy.billingMonthly}${customer.periodEnd ? ` · ${adminCopy.billingUntil} ${dated(customer.periodEnd)}` : ""}`
          : adminCopy.billingGranted,
        amount: subscribed ? formatEur(cents) : adminCopy.billingNoCharge,
        cents,
        at: stamp(customer.periodStart),
      });
    }

    if (customer.advisorInbox) {
      const subscribed = customer.advisorSubscriptionId !== null;
      const cents = subscribed ? grossCents(ADVISOR_INBOX_NET_CENTS) : 0;
      rows.push({
        id: `${customer.userId}-inbox`,
        title: customer.user.email,
        detail: subscribed ? adminCopy.billingInbox : adminCopy.billingGranted,
        amount: subscribed ? formatEur(cents) : adminCopy.billingNoCharge,
        cents,
        at: stamp(customer.periodStart),
      });
    }

    return rows;
  });
  const closeTotal = closeRows.reduce((sum, row) => sum + row.cents, 0);
  const advisorTotal = advisorRows.reduce((sum, row) => sum + row.cents, 0);
  const subscriptionTotal = subscriptionRows.reduce(
    (sum, row) => sum + row.cents,
    0,
  );
  const books: BillingBook[] = [
    {
      id: "subscriptions",
      title: adminCopy.billingSubsTitle,
      total: formatEur(subscriptionTotal),
      count: subscriptionRows.length,
      entries: subscriptionRows,
    },
    {
      id: "listings",
      title: adminCopy.billingListingsTitle,
      total: formatEur(listingTotal),
      count: listings.length,
      entries: listings.map((row) => ({
        id: row.id,
        title: row.project.codename,
        detail: `${row.user.email} · ${dated(row.createdAt)}`,
        amount: formatEur(listingGross),
        cents: listingGross,
        at: stamp(row.createdAt),
      })),
    },
    {
      id: "deposits",
      title: adminCopy.billingDepositsTitle,
      total: formatEur(depositTotal),
      count: deposits.length,
      entries: deposits.map((row) => ({
        id: row.id,
        title: row.project.codename,
        detail: dated(row.depositPaidAt),
        amount: formatEur(row.depositCents),
        cents: row.depositCents,
        at: stamp(row.depositPaidAt),
        refund: { engagementId: row.id, status: refundStatus.get(row.id) ?? null, reviewReady: reviewReady(row) },
      })),
    },
    {
      id: "closes",
      title: adminCopy.billingCloseTitle,
      total: formatEur(closeTotal),
      count: closeRows.length,
      entries: closeRows.map(asEntry),
    },
    {
      id: "advisor-fees",
      title: adminCopy.billingAdvisorFeeTitle,
      total: formatEur(advisorTotal),
      count: advisorRows.length,
      entries: advisorRows.map(asEntry),
    },
  ];

  return {
    live: stripeMode() === "live",
    plans,
    collected: formatEur(listingTotal + depositTotal),
    recorded: formatEur(closeTotal + advisorTotal),
    books,
  };
}
