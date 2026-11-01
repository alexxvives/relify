import {
  isInPeriod,
  matchesLeft,
  matchSlot,
  type BuyerPlanName,
} from "@/lib/billing";
import { prisma } from "@/server/db";

export type BuyerPlanState = {
  plan: BuyerPlanName;
  periodStart: Date | null;
  periodEnd: Date | null;
};

export async function loadBuyerPlan(userId: string): Promise<BuyerPlanState> {
  const row = await prisma.billingCustomer.findUnique({
    where: { userId },
    select: { plan: true, periodStart: true, periodEnd: true },
  });

  if (!row || row.plan === "none") {
    return { plan: "none", periodStart: null, periodEnd: null };
  }

  return {
    plan: row.plan,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
  };
}

async function usage(
  userId: string,
  plan: BuyerPlanState,
): Promise<{ acceptedInPeriod: number; pendingInPeriod: number }> {
  const rows = await prisma.projectAccess.findMany({
    where: { investorId: userId },
    select: { requestedAt: true, sellerAcceptedAt: true, cancelledAt: true },
  });
  let acceptedInPeriod = 0;
  let pendingInPeriod = 0;

  for (const row of rows) {
    if (row.cancelledAt !== null) {
      continue;
    }
    if (
      row.sellerAcceptedAt !== null &&
      isInPeriod(row.sellerAcceptedAt, plan.periodStart, plan.periodEnd)
    ) {
      acceptedInPeriod += 1;
    } else if (
      row.sellerAcceptedAt === null &&
      isInPeriod(row.requestedAt, plan.periodStart, plan.periodEnd)
    ) {
      pendingInPeriod += 1;
    }
  }

  return { acceptedInPeriod, pendingInPeriod };
}

export async function buyerMatchBudget(
  userId: string,
): Promise<{ plan: BuyerPlanName; remaining: number | null }> {
  const plan = await loadBuyerPlan(userId);

  if (plan.plan !== "limited") {
    return { plan: plan.plan, remaining: null };
  }

  const counts = await usage(userId, plan);

  return {
    plan: "limited",
    remaining: matchesLeft(counts.acceptedInPeriod, counts.pendingInPeriod),
  };
}

export async function buyerMatchSlot(
  userId: string,
): Promise<{ ok: true } | { ok: false; code: "plan" | "limit" }> {
  const plan = await loadBuyerPlan(userId);
  const counts = await usage(userId, plan);

  return matchSlot({
    plan: plan.plan,
    periodKnown: plan.periodStart !== null && plan.periodEnd !== null,
    acceptedInPeriod: counts.acceptedInPeriod,
    pendingInPeriod: counts.pendingInPeriod,
  });
}
