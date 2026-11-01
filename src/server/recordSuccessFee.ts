import { randomUUID } from "node:crypto";
import { recordSaleOutcome } from "@/lib/billing";
import { billingCopy } from "@/lib/billing-copy";
import { formatEur } from "@/lib/money";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type RecordSaleResult =
  { ok: true; message: string } | { ok: false; message: string };

export async function recordSuccessFee(
  user: CurrentUser,
  slug: string,
  closedPriceCents: number,
): Promise<RecordSaleResult> {
  const project = await prisma.project.findFirst({
    where: { slug, ownerId: user.id },
    select: { id: true, status: true, successFee: { select: { id: true } } },
  });
  // The buyer rate depends on the plan the winning buyer had when the seller
  // accepted the match. Take the most advanced live process for this company.
  const winner = project
    ? await prisma.projectAccess.findFirst({
        where: {
          projectId: project.id,
          sellerAcceptedAt: { not: null },
          cancelledAt: null,
        },
        orderBy: [
          { loiAcceptedAt: { sort: "desc", nulls: "last" } },
          { sellerAcceptedAt: "desc" },
        ],
        select: { buyerPlanAtMatch: true },
      })
    : null;
  const outcome = recordSaleOutcome({
    buyerPlanAtMatch: winner?.buyerPlanAtMatch ?? null,
    isOwner: project !== null && user.onboarded,
    published: project?.status === "published",
    alreadyRecorded:
      project?.successFee !== null && project?.successFee !== undefined,
    closedPriceCents,
  });

  if (!outcome.ok || !project) {
    if (!outcome.ok && outcome.code === "price") {
      return { ok: false, message: billingCopy.salePriceInvalid };
    }

    if (!outcome.ok && outcome.code === "missing") {
      return { ok: false, message: billingCopy.saleMissing };
    }

    return { ok: false, message: billingCopy.saleForbidden };
  }

  if (outcome.insert) {
    await prisma.successFee.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        closedPriceCents,
        buyerNetCents: outcome.fee.buyerNetCents,
        buyerVatCents: outcome.fee.buyerVatCents,
        sellerNetCents: outcome.fee.sellerNetCents,
        sellerVatCents: outcome.fee.sellerVatCents,
      },
    });
  }

  const buyer = outcome.fee.buyerNetCents + outcome.fee.buyerVatCents;
  const seller = outcome.fee.sellerNetCents + outcome.fee.sellerVatCents;

  return {
    ok: true,
    message: `${billingCopy.saleRecorded} Comprador ${formatEur(buyer)}. Vendedor ${formatEur(seller)}.`,
  };
}
