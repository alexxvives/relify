import { buyerAcceptOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type AcceptBuyerResult = { ok: true } | { ok: false; message: string };

export async function acceptBuyer(
  user: CurrentUser,
  accessId: string,
): Promise<AcceptBuyerResult> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: accessId },
    select: {
      id: true,
      investorId: true,
      sellerAcceptedAt: true,
      // The buyer's plan rides on the same query (relation join) instead of a second round trip.
      investor: { select: { billingCustomer: { select: { plan: true } } } },
      project: { select: { ownerId: true, codename: true, slug: true } },
    },
  });
  // The buyer's match slot is reserved when they send the request (requestProjectAccess checks
  // buyerMatchSlot), so accepting must never be blocked by the buyer's plan state afterwards.
  const buyerCanMatch = access !== null;
  const outcome = buyerAcceptOutcome({
    isOwner:
      access !== null && access.project.ownerId === user.id && user.onboarded,
    requested: access !== null,
    alreadyAccepted:
      access?.sellerAcceptedAt !== null &&
      access?.sellerAcceptedAt !== undefined,
    buyerCanMatch,
  });

  if (!outcome.ok || !access) {
    return { ok: false, message: billingCopy.buyerAcceptFailed };
  }

  if (outcome.stamp) {
    // Same plan rule as loadBuyerPlan: no billing row means "none".
    const plan = access.investor.billingCustomer?.plan ?? "none";
    // Alex (t50): accepting felt slow. Each Prisma call is a separate HTTP round trip to Neon on
    // Workers, so the stamp and the buyer's notice run side by side instead of one after another.
    await Promise.all([
      prisma.projectAccess.update({
        where: { id: access.id },
        data: { sellerAcceptedAt: new Date(), buyerPlanAtMatch: plan },
      }),
      recordNotification({
        userId: access.investorId,
        title: "Solicitud aceptada",
        body: `La empresa ha aceptado tu solicitud en ${access.project.codename}.`,
        href: `/proyectos/${access.project.slug}`,
      }),
    ]);
  }

  return { ok: true };
}
