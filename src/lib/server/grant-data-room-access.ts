import { randomUUID } from "node:crypto";
import {
  dataRoomMessage,
  grantDataRoomOutcome,
  type GrantDataRoomInput,
} from "@/lib/data-room";
import { dataRoomSharedNotice } from "@/lib/notifications";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { recordNotification } from "@/lib/server/record-notification";
import type { DataRoomWriteResult } from "@/lib/server/store-data-room-file";

export async function grantDataRoomAccess(
  user: CurrentUser,
  input: GrantDataRoomInput,
): Promise<DataRoomWriteResult> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: input.accessId },
    select: {
      investorId: true,
      ndaAcceptedAt: true,
      project: { select: { id: true, ownerId: true, codename: true } },
    },
  });
  const existing =
    access === null
      ? null
      : await prisma.dataRoomGrant.findUnique({
          where: {
            projectId_investorId: {
              projectId: access.project.id,
              investorId: access.investorId,
            },
          },
          select: { id: true },
        });
  const outcome = grantDataRoomOutcome({
    onboarded: user.onboarded,
    role: user.role,
    ownsProject: access !== null && access.project.ownerId === user.id,
    ndaAccepted: access !== null && access.ndaAcceptedAt !== null,
    alreadyGranted: existing !== null,
  });

  if (!outcome.ok || !access) {
    return {
      ok: false,
      message: dataRoomMessage(outcome.ok ? "missing" : outcome.code),
    };
  }

  if (outcome.insert) {
    await prisma.dataRoomGrant.create({
      data: {
        id: randomUUID(),
        projectId: access.project.id,
        investorId: access.investorId,
      },
    });
    await recordNotification({
      userId: access.investorId,
      ...dataRoomSharedNotice(access.project.codename),
      href: "/dataroom",
    });
  }

  return { ok: true };
}
