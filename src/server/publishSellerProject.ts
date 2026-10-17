import { sellerPublishOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { startListingCheckout, type CheckoutStart } from "@/server/startCheckout";

export type SellerPublishResult = { ok: true } | CheckoutStart;

export type ListingStatus = "draft" | "pending" | "published";

export async function getSellerListing(userId: string): Promise<{
  status: ListingStatus;
  slug: string;
  feeRecorded: boolean;
  requiresPayment: boolean;
} | null> {
  const activeId = await activeSellerProjectId(userId);
  const project = activeId
    ? await prisma.project.findFirst({
        where: { id: activeId, ownerId: userId },
        select: { status: true, slug: true, successFee: { select: { id: true } }, listingPayment: { select: { id: true } } },
      })
    : null;

  if (!project) {
    return null;
  }

  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: userId, status: { in: ["published", "pending"] } },
  });

  return {
    status: project.status,
    slug: project.slug,
    feeRecorded: project.successFee !== null,
    requiresPayment: project.status === "draft" && liveCompanyCount > 0 && project.listingPayment === null,
  };
}

export async function publishSellerProject(user: CurrentUser): Promise<SellerPublishResult> {
  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({
        where: { id: activeId, ownerId: user.id },
        select: { id: true, status: true, ebitdaCents: true, listingPayment: { select: { id: true } } },
      })
    : null;
  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: user.id, status: { in: ["published", "pending"] } },
  });
  const outcome = sellerPublishOutcome({
    isSeller: user.onboarded && user.role === "seller",
    ownsDraft: project !== null,
    alreadyPublished: project?.status === "published" || project?.status === "pending",
    liveCompanyCount,
    paid: project?.listingPayment !== null && project?.listingPayment !== undefined,
  });

  if (project && project.ebitdaCents <= 0) {
    return {
      ok: false,
      message:
        "El EBITDA tiene que ser positivo para publicar. Un resultado de explotación negativo no entra en el catálogo: la ficha se ordena por lo que el negocio gana, y un EBITDA cero o negativo no deja calcular ese plazo.",
    };
  }

  if (!outcome.ok || !project) {
    if (!outcome.ok && outcome.code === "payment" && project) {
      return startListingCheckout(user, project.id);
    }

    return {
      ok: false,
      message: !outcome.ok && outcome.code === "missing" ? billingCopy.publishMissing : billingCopy.publishForbidden,
    };
  }

  if (outcome.mode === "free" || outcome.mode === "paid") {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "pending" },
    });
  }

  return { ok: true };
}
