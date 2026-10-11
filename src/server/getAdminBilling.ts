import { advisoryServices } from "@/lib/advisory";
import {
  ADVISOR_INBOX_NET_CENTS,
  SELLER_LISTING_NET_CENTS,
  grossCents,
  planNetCents,
} from "@/lib/billing";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { stripeMode } from "@/server/stripe";

export type InvestorPlanCount = { plan: "none" | "limited" | "unlimited"; count: number };

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" });
const recentLimit = 8;

export type BillingEntry = {
  id: string;
  title: string;
  detail: string;
  amount: string;
};

export type BillingBook = {
  id: string;
  title: string;
  note: string;
  total: string;
  count: number;
  entries: BillingEntry[];
};

export async function countInvestorPlans(): Promise<InvestorPlanCount[]> {
  const [investors, limited, unlimited] = await Promise.all([
    prisma.user.count({ where: { role: "investor" } }),
    prisma.billingCustomer.count({ where: { plan: "limited", user: { role: "investor" } } }),
    prisma.billingCustomer.count({ where: { plan: "unlimited", user: { role: "investor" } } }),
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
  quotes: number;
  books: BillingBook[];
};

function dated(value: Date | null): string {
  return value ? when.format(value) : "";
}

function serviceNames(ids: readonly string[]): string {
  return ids
    .map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id)
    .join(", ");
}

function recent<T>(rows: T[]): T[] {
  return rows.slice(0, recentLimit);
}

function asEntry(row: { id: string; title: string; detail: string; amount: string; cents: number }): BillingEntry {
  return { id: row.id, title: row.title, detail: row.detail, amount: row.amount };
}

export async function getAdminBilling(user: CurrentUser): Promise<AdminBilling | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const [plans, quotes, listings, fees, engagements, deposits, customers] = await Promise.all([
    countInvestorPlans(),
    prisma.advisoryQuote.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, services: true, createdAt: true, investor: { select: { email: true } } },
    }),
    prisma.listingPayment.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, project: { select: { codename: true } }, user: { select: { email: true } } },
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
      where: { depositPaidAt: { not: null } },
      orderBy: { depositPaidAt: "desc" },
      select: { id: true, depositPaidAt: true, depositCents: true, project: { select: { codename: true } } },
    }),
    prisma.billingCustomer.findMany({
      where: { OR: [{ plan: { not: "none" } }, { advisorInbox: true }] },
      select: {
        userId: true,
        plan: true,
        stripeSubscriptionId: true,
        periodEnd: true,
        advisorInbox: true,
        advisorSubscriptionId: true,
        user: { select: { email: true } },
      },
    }),
  ]);
  const listingGross = grossCents(SELLER_LISTING_NET_CENTS);
  const listingTotal = listings.length * listingGross;
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
    };
  });
  const subscriptionRows = customers.flatMap((customer) => {
    const rows: BillingEntry[] = [];

    if (customer.plan === "limited" || customer.plan === "unlimited") {
      const subscribed = customer.stripeSubscriptionId !== null;
      rows.push({
        id: `${customer.userId}-plan`,
        title: customer.user.email,
        detail: subscribed
          ? `${adminCopy.billingMonthly}${customer.periodEnd ? ` · ${adminCopy.billingUntil} ${dated(customer.periodEnd)}` : ""}`
          : adminCopy.billingGranted,
        amount: subscribed ? formatEur(grossCents(planNetCents(customer.plan))) : adminCopy.billingNoCharge,
      });
    }

    if (customer.advisorInbox) {
      const subscribed = customer.advisorSubscriptionId !== null;
      rows.push({
        id: `${customer.userId}-inbox`,
        title: customer.user.email,
        detail: subscribed ? adminCopy.billingInbox : adminCopy.billingGranted,
        amount: subscribed ? formatEur(grossCents(ADVISOR_INBOX_NET_CENTS)) : adminCopy.billingNoCharge,
      });
    }

    return rows;
  });
  const closeTotal = closeRows.reduce((sum, row) => sum + row.cents, 0);
  const advisorTotal = advisorRows.reduce((sum, row) => sum + row.cents, 0);
  const books: BillingBook[] = [
    {
      id: "subscriptions",
      title: adminCopy.billingSubsTitle,
      note: adminCopy.billingSubsNote,
      total: String(subscriptionRows.length),
      count: subscriptionRows.length,
      entries: recent(subscriptionRows),
    },
    {
      id: "listings",
      title: adminCopy.billingListingsTitle,
      note: adminCopy.billingListingsNote,
      total: formatEur(listingTotal),
      count: listings.length,
      entries: recent(
        listings.map((row) => ({
          id: row.id,
          title: row.project.codename,
          detail: `${row.user.email} · ${dated(row.createdAt)}`,
          amount: formatEur(listingGross),
        })),
      ),
    },
    {
      id: "deposits",
      title: adminCopy.billingDepositsTitle,
      note: adminCopy.billingDepositsNote,
      total: formatEur(depositTotal),
      count: deposits.length,
      entries: recent(
        deposits.map((row) => ({
          id: row.id,
          title: row.project.codename,
          detail: dated(row.depositPaidAt),
          amount: formatEur(row.depositCents),
        })),
      ),
    },
    {
      id: "closes",
      title: adminCopy.billingCloseTitle,
      note: adminCopy.billingCloseNote,
      total: formatEur(closeTotal),
      count: closeRows.length,
      entries: recent(closeRows.map(asEntry)),
    },
    {
      id: "advisor-fees",
      title: adminCopy.billingAdvisorFeeTitle,
      note: adminCopy.billingAdvisorFeeNote,
      total: formatEur(advisorTotal),
      count: advisorRows.length,
      entries: recent(advisorRows.map(asEntry)),
    },
    {
      id: "quotes",
      title: adminCopy.quotesTitle,
      note: adminCopy.billingQuotesNote,
      total: String(quotes.length),
      count: quotes.length,
      entries: recent(
        quotes.map((quote) => ({
          id: quote.id,
          title: quote.investor.email,
          detail: `${serviceNames(quote.services)} · ${dated(quote.createdAt)}`,
          amount: adminCopy.billingNoCharge,
        })),
      ),
    },
  ];

  return {
    live: stripeMode() === "live",
    plans,
    collected: formatEur(listingTotal + depositTotal),
    recorded: formatEur(closeTotal + advisorTotal),
    quotes: quotes.length,
    books,
  };
}
