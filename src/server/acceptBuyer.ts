import { buyerAcceptOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import { buyerCanBeAccepted } from "@/server/buyerPlan";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type AcceptBuyerResult = { ok: true } | { ok: false; message: string };

export async function acceptBuyer(user: CurrentUser, accessId: string): Promise<AcceptBuyerResult> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: accessId },
    select: {
      id: true,
      investorId: true,
      sellerAcceptedAt: true,
      project: { select: { ownerId: true, codename: true, slug: true } },
    },
  });
  const buyerCanMatch = access ? await buyerCanBeAccepted(access.investorId) : false;
  const outcome = buyerAcceptOutcome({
    isOwner: access !== null && access.project.ownerId === user.id && user.onboarded,
    requested: access !== null,
    alreadyAccepted: access?.sellerAcceptedAt !== null && access?.sellerAcceptedAt !== undefined,
    buyerCanMatch,
  });

  if (!outcome.ok || !access) {
    if (!outcome.ok && outcome.code === "limit") {
      return { ok: false, message: billingCopy.buyerLimit };
    }

    return { ok: false, message: billingCopy.buyerAcceptFailed };
  }

  if (outcome.stamp) {
    await prisma.projectAccess.update({
      where: { id: access.id },
      data: { sellerAcceptedAt: new Date() },
    });
    await recordNotification({
      userId: access.investorId,
      title: "Solicitud aceptada",
      body: `La empresa ha aceptado tu solicitud en ${access.project.codename}.`,
      href: `/proyectos/${access.project.slug}`,
    });
  }

  return { ok: true };
}
