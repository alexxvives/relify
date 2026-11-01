import { z } from "zod";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const accessIdSchema = z.string().trim().min(1).max(80);

export async function passDiligence(
  user: CurrentUser,
  accessId: string,
): Promise<{ ok: true; slug: string } | { ok: false; message: string }> {
  const parsed = accessIdSchema.safeParse(accessId);

  if (!parsed.success || !user.onboarded) {
    return { ok: false, message: "No se ha podido continuar." };
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      investorId: true,
      projectId: true,
      sellerAcceptedAt: true,
      ndaAcceptedAt: true,
      loiAcceptedAt: true,
      project: { select: { ownerId: true, slug: true } },
    },
  });
  const allowed =
    access !== null &&
    (access.investorId === user.id || access.project.ownerId === user.id);

  if (
    !access ||
    !allowed ||
    access.sellerAcceptedAt === null ||
    access.ndaAcceptedAt === null ||
    access.loiAcceptedAt === null
  ) {
    return { ok: false, message: "No se ha podido continuar." };
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
    return {
      ok: false,
      message: "La documentación se abre después de la carta de intenciones.",
    };
  }

  await prisma.projectAccess.update({
    where: { id: access.id },
    data: { diligencePassedAt: new Date() },
  });

  return { ok: true, slug: access.project.slug };
}
