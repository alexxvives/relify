import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { recordNotification } from "@/lib/server/record-notification";

export type AcceptLoiResult =
  { ok: true; slug: string } | { ok: false; message: string };

export async function acceptLoi(
  user: CurrentUser,
  accessId: string,
): Promise<AcceptLoiResult> {
  if (
    !user.onboarded ||
    user.role !== "seller" ||
    accessId.trim().length === 0
  ) {
    return { ok: false, message: "No se ha podido aceptar la carta." };
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: accessId },
    select: {
      id: true,
      investorId: true,
      projectId: true,
      sellerAcceptedAt: true,
      ndaAcceptedAt: true,
      loiAcceptedAt: true,
      project: {
        select: {
          ownerId: true,
          codename: true,
          slug: true,
          successFee: { select: { id: true } },
        },
      },
    },
  });

  if (
    !access ||
    access.project.ownerId !== user.id ||
    access.sellerAcceptedAt === null ||
    access.ndaAcceptedAt === null
  ) {
    return { ok: false, message: "No se ha podido aceptar la carta." };
  }

  const offer = await prisma.projectMessage.findFirst({
    where: {
      projectId: access.projectId,
      investorId: access.investorId,
      kind: "offer",
    },
    select: { id: true },
  });

  if (!offer) {
    return { ok: false, message: "Todavía no hay una carta de intenciones." };
  }

  if (access.loiAcceptedAt === null && access.project.successFee === null) {
    // One accepted LOI per project: it locks the deal until that process is
    // cancelled or the sale closes.
    const locked = await prisma.projectAccess.findFirst({
      where: {
        projectId: access.projectId,
        id: { not: access.id },
        loiAcceptedAt: { not: null },
        cancelledAt: null,
      },
      select: { id: true },
    });

    if (locked) {
      return {
        ok: false,
        message:
          "Ya has aceptado una carta de intenciones de otro comprador para esta empresa. Para aceptar esta, primero cancela ese proceso o espera a que se cierre la compraventa.",
      };
    }
  }

  if (access.loiAcceptedAt === null) {
    await prisma.projectAccess.update({
      where: { id: access.id },
      data: { loiAcceptedAt: new Date() },
    });
    await recordNotification({
      userId: access.investorId,
      title: "Carta aceptada",
      body: `La empresa ha aceptado la carta de intenciones de ${access.project.codename}.`,
      href: `/proyectos/${access.project.slug}`,
    });
  }

  return { ok: true, slug: access.project.slug };
}
