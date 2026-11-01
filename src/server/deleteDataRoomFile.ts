import { randomUUID } from "node:crypto";
import { dataRoomMessage, dataRoomReadGate } from "@/lib/data-room";
import { relevaDraftFolder, relevaDrafts } from "@/lib/releva-drafts";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { deleteDataRoomBytes } from "@/server/dataRoomDisk";
import { activeSellerProjectId } from "@/server/sellerCompany";
import type { DataRoomWriteResult } from "@/server/storeDataRoomFile";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function hideRelevaDraft(
  projectId: string,
  fileName: string,
): Promise<void> {
  const existing = await prisma.dataRoomFile.findFirst({
    where: { projectId, folder: relevaDraftFolder, fileName },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.dataRoomFile.create({
    data: { id: randomUUID(), projectId, folder: relevaDraftFolder, fileName },
  });
}

export async function deleteDataRoomFile(
  user: CurrentUser,
  fileId: string,
): Promise<DataRoomWriteResult> {
  const draft = relevaDrafts.find((item) => item.id === fileId);

  if (!draft && !idPattern.test(fileId)) {
    return { ok: false, message: sellerCopy.documentForbidden };
  }

  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: sellerCopy.documentForbidden };
  }

  if (draft) {
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
      return {
        ok: false,
        message: dataRoomMessage(gate.ok ? "missing" : gate.code),
      };
    }

    await hideRelevaDraft(project.id, draft.fileName);
    return { ok: true };
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
    return {
      ok: false,
      message: dataRoomMessage(gate.ok ? "missing" : gate.code),
    };
  }

  await prisma.dataRoomFile.delete({ where: { id: file.id } });
  await deleteDataRoomBytes(file.id);
  return { ok: true };
}
