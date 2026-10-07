import { advisorPublishOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { startListingCheckout, type CheckoutStart } from "@/server/startCheckout";

export type PublishClientResult = { ok: true } | CheckoutStart;

export async function publishClientCompany(user: CurrentUser, slug: string): Promise<PublishClientResult> {
  const project = await prisma.project.findFirst({
    where: { slug, ownerId: user.id },
    select: { id: true, status: true, listingPayment: { select: { id: true } } },
  });
  const liveCompanyCount = await prisma.project.count({
    where: { ownerId: user.id, status: "published" },
  });
  const outcome = advisorPublishOutcome({
    isAdvisor: user.onboarded && user.role === "advisor",
    ownsDraft: project !== null,
    alreadyPublished: project?.status === "published",
    liveCompanyCount,
    paid: project?.listingPayment !== null && project?.listingPayment !== undefined,
  });

  if (!outcome.ok || !project) {
    if (!outcome.ok && outcome.code === "payment" && project) {
      return startListingCheckout(user, project.id);
    }

    const message =
      !outcome.ok && outcome.code === "missing" ? billingCopy.publishMissing : billingCopy.publishForbidden;
    return { ok: false, message };
  }

  if (outcome.mode !== "already") {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "published" },
    });
  }

  return { ok: true };
}
