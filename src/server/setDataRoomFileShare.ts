import { randomUUID } from "node:crypto";
import { dataRoomMessage, grantDataRoomOutcome } from "@/lib/data-room";
import { dataRoomSharedNotice } from "@/lib/notifications";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";
import type { DataRoomWriteResult } from "@/server/storeDataRoomFile";

export async function setDataRoomFileShare(
  user: CurrentUser,
  input: { fileId: string; accessId: string; shared: boolean },
): Promise<DataRoomWriteResult> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: input.accessId },
    select: {
      investorId: true,
      ndaAcceptedAt: true,
      project: { select: { id: true, ownerId: true, codename: true } },
    },
  });
  const file =
    access === null
      ? null
      : await prisma.dataRoomFile.findFirst({
          where: { id: input.fileId, projectId: access.project.id },
          select: { id: true },
        });
  const existing =
    access === null
      ? null
      : await prisma.dataRoomGrant.findUnique({
          where: { projectId_investorId: { projectId: access.project.id, investorId: access.investorId } },
          select: { id: true },
        });
  const outcome = grantDataRoomOutcome({
    onboarded: user.onboarded,
    role: user.role,
    ownsProject: access !== null && access.project.ownerId === user.id,
    ndaAccepted: access !== null && access.ndaAcceptedAt !== null,
    alreadyGranted: existing !== null,
  });

  if (!outcome.ok || !access || !file) {
    return { ok: false, message: dataRoomMessage(outcome.ok ? "missing" : outcome.code) };
  }

  if (input.shared) {
    await prisma.dataRoomFileShare.upsert({
      where: { fileId_investorId: { fileId: file.id, investorId: access.investorId } },
      update: {},
      create: { id: randomUUID(), fileId: file.id, investorId: access.investorId },
    });

    if (outcome.insert) {
      await prisma.dataRoomGrant.create({
        data: { id: randomUUID(), projectId: access.project.id, investorId: access.investorId },
      });
      await recordNotification({
        userId: access.investorId,
        ...dataRoomSharedNotice(access.project.codename),
        href: "/dataroom",
      });
    }

    return { ok: true };
  }

  await prisma.dataRoomFileShare.deleteMany({
    where: { fileId: file.id, investorId: access.investorId },
  });

  return { ok: true };
}
