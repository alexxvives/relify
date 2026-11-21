import { notifyPublishRequest } from "@/lib/server/submit-for-review";
import { sellerPublishOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { adminChecksMessage, missingHint } from "@/lib/publish-checklist";
import { prisma } from "@/lib/db";
import { launchFreeMode } from "@/lib/launch-mode";
import { loadPublishChecks } from "@/lib/server/publish-checks";
import { reconcileListingPayment } from "@/lib/server/fulfill-checkout";
import { activeSellerProjectId } from "@/lib/server/seller-company";
import {
  startListingCheckout,
  type CheckoutStart,
} from "@/lib/server/start-checkout";

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
        select: {
          id: true,
          status: true,
          slug: true,
          successFee: { select: { id: true } },
          listingPayment: { select: { id: true } },
        },
      })
    : null;

  if (!project) {
    return null;
  }

  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: userId, status: { in: ["published", "pending"] } },
  });
  // S43: the free launch never asks for the listing payment (and never asks Stripe to reconcile one).
  const paid =
    launchFreeMode() ||
    project.listingPayment !== null ||
    (project.status === "draft" &&
      liveCompanyCount > 0 &&
      (await reconcileListingPayment(userId, project.id)));

  return {
    status: project.status,
    slug: project.slug,
    feeRecorded: project.successFee !== null,
    requiresPayment:
      project.status === "draft" && liveCompanyCount > 0 && !paid,
  };
}

export async function publishSellerProject(
  user: CurrentUser,
): Promise<SellerPublishResult> {
  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({
        where: { id: activeId, ownerId: user.id },
        select: {
          id: true,
          status: true,
          listingPayment: { select: { id: true } },
        },
      })
    : null;
  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: user.id, status: { in: ["published", "pending"] } },
  });
  const outcome = sellerPublishOutcome({
    isSeller: user.onboarded && user.role === "seller",
    ownsDraft: project !== null,
    alreadyPublished:
      project?.status === "published" || project?.status === "pending",
    liveCompanyCount,
    // S43: the free launch publishes extra companies without the listing payment.
    paid:
      launchFreeMode() ||
      (project?.listingPayment !== null && project?.listingPayment !== undefined),
  });

  // t75: the seller checklist and the admin checks (financials loaded, EBITDA > 0) gate every
  // seller-triggered submission, so nobody pays for a listing we would not approve.
  if (project && project.status === "draft") {
    const checks = await loadPublishChecks(project.id);

    if (!checks || !checks.seller.ready) {
      return { ok: false, message: missingHint(checks?.seller.missing ?? []) || billingCopy.publishMissing };
    }

    if (!checks.admin.ready) {
      return { ok: false, message: adminChecksMessage(checks.admin) };
    }
  }

  if (!outcome.ok || !project) {
    if (!outcome.ok && outcome.code === "payment" && project) {
      return startListingCheckout(user, project.id);
    }

    return {
      ok: false,
      message:
        !outcome.ok && outcome.code === "missing"
          ? billingCopy.publishMissing
          : billingCopy.publishForbidden,
    };
  }

  if (outcome.mode === "free" || outcome.mode === "paid") {
    const moved = await prisma.project.updateMany({
      where: { id: project.id, status: "draft" },
      data: { status: "pending" },
    });
    if (moved.count > 0) {
      await notifyPublishRequest(project.id, outcome.mode === "paid" && !launchFreeMode());
    }
  }

  return { ok: true };
}
