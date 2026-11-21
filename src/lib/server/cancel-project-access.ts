import { accessCopy } from "@/lib/access-copy";
import { processCancelledNotice } from "@/lib/notifications";
import { personName } from "@/lib/project-message";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { refundDepositsWhere } from "@/lib/server/deposit-refund";
import { recordNotification } from "@/lib/server/record-notification";

export type CancelAccessResult = { ok: true } | { ok: false; message: string };

export async function cancelProjectAccess(
  user: CurrentUser,
  accessId: string,
): Promise<CancelAccessResult> {
  if (!user.onboarded || (user.role !== "investor" && user.role !== "seller")) {
    return { ok: false, message: accessCopy.cancelFailed };
  }

  const access = await prisma.projectAccess.findFirst({
    where: { id: accessId, cancelledAt: null },
    select: {
      id: true,
      investorId: true,
      sellerAcceptedAt: true,
      investor: { select: { name: true, lastName: true } },
      project: {
        select: {
          id: true,
          ownerId: true,
          codename: true,
          slug: true,
          successFee: { select: { id: true } },
        },
      },
    },
  });

  if (!access || access.project.successFee) {
    return { ok: false, message: accessCopy.cancelFailed };
  }

  const seller = access.project.ownerId === user.id && user.role === "seller";
  const investor = access.investorId === user.id && user.role === "investor";

  if (!seller && !investor) {
    return { ok: false, message: accessCopy.cancelFailed };
  }

  await prisma.projectAccess.update({
    where: { id: access.id },
    data: {
      cancelledAt: new Date(),
      cancelledBy: seller ? "seller" : "investor",
    },
  });
  // S38: the buyer's process is over, so the deposit of the asesor that buyer hired goes back.
  await refundDepositsWhere(
    { projectId: access.project.id, requesterId: access.investorId, client: "investor" },
    "cancelled",
  );

  const self = processCancelledNotice(access.project.codename, "self");
  await recordNotification({
    userId: user.id,
    ...self,
    href: seller ? "/mi-empresa/procesos" : "/procesos",
  });

  const otherId = seller ? access.investorId : access.project.ownerId;
  if (otherId && otherId !== user.id) {
    const other = processCancelledNotice(
      access.project.codename,
      seller ? "seller" : "investor",
      access.sellerAcceptedAt
        ? personName(access.investor.name, access.investor.lastName)
        : null,
    );
    await recordNotification({
      userId: otherId,
      ...other,
      href: seller
        ? `/proyectos/${access.project.slug}`
        : "/mi-empresa/procesos",
    });
  }

  return { ok: true };
}
