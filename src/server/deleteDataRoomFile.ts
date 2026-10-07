import { dataRoomMessage, dataRoomReadGate } from "@/lib/data-room";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { deleteDataRoomBytes } from "@/server/dataRoomDisk";
import { activeSellerProjectId } from "@/server/sellerCompany";
import type { DataRoomWriteResult } from "@/server/storeDataRoomFile";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteDataRoomFile(user: CurrentUser, fileId: string): Promise<DataRoomWriteResult> {
  if (!idPattern.test(fileId) || !user.onboarded || user.role !== "seller") {
    return { ok: false, message: sellerCopy.documentForbidden };
  }

  const activeId = await activeSellerProjectId(user.id);
  const file = await prisma.dataRoomFile.findFirst({
    where: { id: fileId, project: { id: activeId ?? "", ownerId: user.id } },
    select: { id: true, project: { select: { status: true } } },
  });
  const gate = dataRoomReadGate({
    onboarded: user.onboarded,
    role: user.role,
    ownsProject: file !== null,
    projectStatus: file?.project.status ?? null,
    ndaAcceptedAt: null,
    granted: false,
  });

  if (!gate.ok || gate.audience !== "owner" || !file) {
    return { ok: false, message: dataRoomMessage(gate.ok ? "missing" : gate.code) };
  }

  await prisma.dataRoomFile.delete({ where: { id: file.id } });
  await deleteDataRoomBytes(file.id);
  return { ok: true };
}
