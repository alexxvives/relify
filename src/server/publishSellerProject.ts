import { sellerPublishOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type SellerPublishResult = { ok: true } | { ok: false; message: string };

export async function getSellerListing(userId: string): Promise<{
  status: "draft" | "published";
  slug: string;
  feeRecorded: boolean;
} | null> {
  const activeId = await activeSellerProjectId(userId);
  const project = activeId
    ? await prisma.project.findFirst({
    where: { id: activeId, ownerId: userId },
    select: { status: true, slug: true, successFee: { select: { id: true } } },
  })
    : null;

  if (!project) {
    return null;
  }

  return {
    status: project.status,
    slug: project.slug,
    feeRecorded: project.successFee !== null,
  };
}

export async function publishSellerProject(user: CurrentUser): Promise<SellerPublishResult> {
  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({
    where: { id: activeId, ownerId: user.id },
    select: { id: true, status: true },
  })
    : null;
  const outcome = sellerPublishOutcome({
    isSeller: user.onboarded && user.role === "seller",
    ownsDraft: project !== null,
    alreadyPublished: project?.status === "published",
  });

  if (!outcome.ok || !project) {
    return {
      ok: false,
      message: !outcome.ok && outcome.code === "missing" ? billingCopy.publishMissing : billingCopy.publishForbidden,
    };
  }

  if (outcome.publish) {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "published" },
    });
  }

  return { ok: true };
}
