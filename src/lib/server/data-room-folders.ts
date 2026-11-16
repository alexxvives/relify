import { randomUUID } from "node:crypto";
import {
  dataRoomMessage,
  dataRoomReadGate,
  folderNameSchema,
  visibleFolderNames,
} from "@/lib/data-room";
import { dataRoomFolderNames, sellerCopy } from "@/lib/seller-copy";

function isDefaultFolder(name: string): boolean {
  return dataRoomFolderNames.some((folder) => folder === name);
}
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { deleteDataRoomBytes } from "@/lib/server/data-room-disk";
import { activeSellerProjectId } from "@/lib/server/seller-company";
import type { DataRoomWriteResult } from "@/lib/server/store-data-room-file";

async function ownedProject(user: CurrentUser) {
  if (!user.onboarded || user.role !== "seller") {
    return null;
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
    return null;
  }

  return project;
}

export async function createDataRoomFolder(
  user: CurrentUser,
  name: string,
): Promise<DataRoomWriteResult> {
  const parsed = folderNameSchema.safeParse(name);
  const project = await ownedProject(user);

  if (!parsed.success || !project) {
    return {
      ok: false,
      message: parsed.success
        ? sellerCopy.documentForbidden
        : sellerCopy.folderInvalid,
    };
  }

  const existing = await prisma.dataRoomFolder.findUnique({
    where: { projectId_name: { projectId: project.id, name: parsed.data } },
    select: { id: true, hidden: true },
  });

  if (existing?.hidden) {
    await prisma.dataRoomFolder.update({
      where: { id: existing.id },
      data: { hidden: false },
    });
    return { ok: true };
  }

  if (!existing && !isDefaultFolder(parsed.data)) {
    await prisma.dataRoomFolder.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        name: parsed.data,
        hidden: false,
      },
    });
  }

  return { ok: true };
}

export async function renameDataRoomFolder(
  user: CurrentUser,
  fromName: string,
  toName: string,
): Promise<DataRoomWriteResult> {
  const from = folderNameSchema.safeParse(fromName);
  const to = folderNameSchema.safeParse(toName);
  const project = await ownedProject(user);

  if (!from.success || !to.success || !project) {
    return {
      ok: false,
      message:
        from.success && to.success
          ? sellerCopy.documentForbidden
          : sellerCopy.folderInvalid,
    };
  }

  if (from.data === to.data) {
    return { ok: true };
  }

  const records = await prisma.dataRoomFolder.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true, hidden: true },
  });
  const files = await prisma.dataRoomFile.findMany({
    where: { projectId: project.id },
    select: { folder: true },
  });
  const visible = visibleFolderNames({
    records,
    usedByFiles: files.map((file) => file.folder),
  });

  if (!visible.includes(from.data)) {
    return { ok: false, message: dataRoomMessage("missing") };
  }

  if (visible.includes(to.data)) {
    return { ok: false, message: sellerCopy.folderExists };
  }

  await prisma.dataRoomFile.updateMany({
    where: { projectId: project.id, folder: from.data },
    data: { folder: to.data },
  });

  if (isDefaultFolder(from.data)) {
    await prisma.dataRoomFolder.upsert({
      where: { projectId_name: { projectId: project.id, name: from.data } },
      update: { hidden: true },
      create: {
        id: randomUUID(),
        projectId: project.id,
        name: from.data,
        hidden: true,
      },
    });
  } else {
    await prisma.dataRoomFolder.deleteMany({
      where: { projectId: project.id, name: from.data },
    });
  }

  const target = await prisma.dataRoomFolder.findUnique({
    where: { projectId_name: { projectId: project.id, name: to.data } },
    select: { id: true },
  });

  if (target) {
    await prisma.dataRoomFolder.update({
      where: { id: target.id },
      data: { hidden: false },
    });
  } else if (!isDefaultFolder(to.data)) {
    await prisma.dataRoomFolder.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        name: to.data,
        hidden: false,
      },
    });
  }

  return { ok: true };
}

export async function deleteDataRoomFolder(
  user: CurrentUser,
  name: string,
): Promise<DataRoomWriteResult> {
  const parsed = folderNameSchema.safeParse(name);
  const project = await ownedProject(user);

  if (!parsed.success || !project) {
    return {
      ok: false,
      message: parsed.success
        ? sellerCopy.documentForbidden
        : sellerCopy.folderInvalid,
    };
  }

  const records = await prisma.dataRoomFolder.findMany({
    where: { projectId: project.id },
    select: { name: true, hidden: true },
  });
  const files = await prisma.dataRoomFile.findMany({
    where: { projectId: project.id },
    select: { id: true, folder: true },
  });
  const visible = visibleFolderNames({
    records,
    usedByFiles: files.map((file) => file.folder),
  });

  if (!visible.includes(parsed.data)) {
    return { ok: false, message: dataRoomMessage("missing") };
  }

  const removed = files.filter((file) => file.folder === parsed.data);
  await prisma.dataRoomFile.deleteMany({
    where: { projectId: project.id, folder: parsed.data },
  });
  await Promise.all(removed.map((file) => deleteDataRoomBytes(file.id)));
  const standard = isDefaultFolder(parsed.data);

  if (standard) {
    await prisma.dataRoomFolder.upsert({
      where: { projectId_name: { projectId: project.id, name: parsed.data } },
      update: { hidden: true },
      create: {
        id: randomUUID(),
        projectId: project.id,
        name: parsed.data,
        hidden: true,
      },
    });
  } else {
    await prisma.dataRoomFolder.deleteMany({
      where: { projectId: project.id, name: parsed.data },
    });
  }

  return { ok: true };
}
