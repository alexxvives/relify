import { adminCopy } from "@/lib/admin-copy";
import { grantPlanSchema } from "@/lib/grant-plan";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export { grantPlanSchema } from "@/lib/grant-plan";

const grantDays = 30;

export type AdminMutation =
  { ok: true; message: string } | { ok: false; message: string };

export async function grantInvestorPlan(
  user: CurrentUser,
  userId: string,
  plan: string,
): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = grantPlanSchema.safeParse({ userId, plan });

  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  const account = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      role: true,
      billingCustomer: { select: { stripeCustomerId: true } },
    },
  });

  if (!account) {
    return { ok: false, message: adminCopy.missingAccount };
  }

  if (account.role !== "investor") {
    return { ok: false, message: adminCopy.planInvestorOnly };
  }

  if (parsed.data.plan === "none") {
    if (account.billingCustomer) {
      await prisma.billingCustomer.update({
        where: { userId: account.id },
        data: { plan: "none", periodStart: null, periodEnd: null },
      });
    }
    return { ok: true, message: adminCopy.planCleared };
  }

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + grantDays);

  if (account.billingCustomer) {
    await prisma.billingCustomer.update({
      where: { userId: account.id },
      data: { plan: parsed.data.plan, periodStart, periodEnd },
    });
  } else {
    await prisma.billingCustomer.create({
      data: {
        userId: account.id,
        stripeCustomerId: `admin-grant-${account.id}`,
        plan: parsed.data.plan,
        periodStart,
        periodEnd,
      },
    });
  }

  return { ok: true, message: adminCopy.planGranted };
}
