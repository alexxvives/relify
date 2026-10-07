import { dataRoomReadGate } from "@/lib/data-room";
import { advisorMayReadFile } from "@/server/advisoryEngagement";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { readDataRoomBytes } from "@/server/dataRoomDisk";

export async function readDataRoomFileDownload(
  user: CurrentUser,
  fileId: string,
): Promise<{ fileName: string; bytes: Buffer } | null> {
  if (!user.onboarded || (user.role !== "seller" && user.role !== "investor" && user.role !== "advisor")) {
    return null;
  }

  if (user.role === "advisor") {
    const allowed = await advisorMayReadFile(user.id, fileId);

    if (!allowed) {
      return null;
    }

    const named = await prisma.dataRoomFile.findUnique({
      where: { id: fileId },
      select: { fileName: true },
    });
    const bytes = named ? await readDataRoomBytes(fileId) : null;

    if (!named || !bytes) {
      return null;
    }

    return { fileName: named.fileName, bytes };
  }

  const file = await prisma.dataRoomFile.findUnique({
    where: { id: fileId },
    select: {
      fileName: true,
      project: { select: { id: true, ownerId: true, status: true } },
    },
  });

  if (!file) {
    return null;
  }

  const owns = user.role === "seller" && file.project.ownerId === user.id;

  if (!owns) {
    const [access, grant, share] = await Promise.all([
      prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: file.project.id, investorId: user.id } },
        select: { ndaAcceptedAt: true },
      }),
      prisma.dataRoomGrant.findUnique({
        where: { projectId_investorId: { projectId: file.project.id, investorId: user.id } },
        select: { id: true },
      }),
      prisma.dataRoomFileShare.findUnique({
        where: { fileId_investorId: { fileId, investorId: user.id } },
        select: { id: true },
      }),
    ]);
    const gate = dataRoomReadGate({
      onboarded: user.onboarded,
      role: user.role,
      ownsProject: false,
      projectStatus: file.project.status,
      ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
      granted: grant !== null,
    });

    if (!gate.ok || gate.audience !== "investor" || share === null) {
      return null;
    }
  }

  const bytes = await readDataRoomBytes(fileId);

  if (!bytes) {
    return null;
  }

  return { fileName: file.fileName, bytes };
}
