import { randomUUID } from "node:crypto";
import { dataRoomMessage, dataRoomReadGate, visibleFolderNames, type StoreDataRoomFileInput } from "@/lib/data-room";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type DataRoomWriteResult = { ok: true } | { ok: false; message: string };

export async function storeDataRoomFile(
  user: CurrentUser,
  input: StoreDataRoomFileInput,
): Promise<DataRoomWriteResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: sellerCopy.documentForbidden };
  }

  const activeId = await activeSellerProjectId(user.id);
  const project = activeId
    ? await prisma.project.findFirst({
    where: { id: activeId, ownerId: user.id },
    select: { id: true, status: true },
  })
    : null;
  const gate = dataRoomReadGate({
    onboarded: user.onboarded,
    role: user.role,
    ownsProject: project !== null,
    projectStatus: project?.status ?? null,
    ndaAcceptedAt: null,
    granted: false,
  });

  if (!gate.ok || gate.audience !== "owner" || !project) {
    return { ok: false, message: dataRoomMessage(gate.ok ? "missing" : gate.code) };
  }

  const [records, used] = await Promise.all([
    prisma.dataRoomFolder.findMany({ where: { projectId: project.id }, select: { name: true, hidden: true } }),
    prisma.dataRoomFile.findMany({ where: { projectId: project.id }, select: { folder: true } }),
  ]);

  if (!visibleFolderNames({ records, usedByFiles: used.map((file) => file.folder) }).includes(input.folder)) {
    return { ok: false, message: sellerCopy.folderInvalid };
  }

  await prisma.dataRoomFile.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      fileName: input.fileName,
      folder: input.folder,
    },
  });

  return { ok: true };
}
