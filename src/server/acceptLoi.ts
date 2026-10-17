import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type AcceptLoiResult = { ok: true; slug: string } | { ok: false; message: string };

export async function acceptLoi(user: CurrentUser, accessId: string): Promise<AcceptLoiResult> {
  if (!user.onboarded || user.role !== "seller" || accessId.trim().length === 0) {
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
      project: { select: { ownerId: true, codename: true, slug: true } },
    },
  });

  if (!access || access.project.ownerId !== user.id || access.sellerAcceptedAt === null || access.ndaAcceptedAt === null) {
    return { ok: false, message: "No se ha podido aceptar la carta." };
  }

  const offer = await prisma.projectMessage.findFirst({
    where: { projectId: access.projectId, investorId: access.investorId, kind: "offer" },
    select: { id: true },
  });

  if (!offer) {
    return { ok: false, message: "Todavía no hay una carta de intenciones." };
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
