import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { stripeMode } from "@/server/stripe";

export type InvestorPlanCount = { plan: "none" | "limited" | "unlimited"; count: number };

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
  quotes: number;
};

export async function getAdminBilling(user: CurrentUser): Promise<AdminBilling | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const [plans, quotes] = await Promise.all([countInvestorPlans(), prisma.advisoryQuote.count()]);

  return {
    live: stripeMode() === "live",
    plans,
    quotes,
  };
}
