import { randomUUID } from "node:crypto";
import { dataRoomMessage, dataRoomReadGate, folderNameSchema, visibleFolderNames } from "@/lib/data-room";
import { dataRoomFolderNames, sellerCopy } from "@/lib/seller-copy";

function isDefaultFolder(name: string): boolean {
  return dataRoomFolderNames.some((folder) => folder === name);
}
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import type { DataRoomWriteResult } from "@/server/storeDataRoomFile";

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

export async function createDataRoomFolder(user: CurrentUser, name: string): Promise<DataRoomWriteResult> {
  const parsed = folderNameSchema.safeParse(name);
  const project = await ownedProject(user);

  if (!parsed.success || !project) {
    return { ok: false, message: parsed.success ? sellerCopy.documentForbidden : sellerCopy.folderInvalid };
  }

  const existing = await prisma.dataRoomFolder.findUnique({
    where: { projectId_name: { projectId: project.id, name: parsed.data } },
    select: { id: true, hidden: true },
  });

  if (existing?.hidden) {
    await prisma.dataRoomFolder.update({ where: { id: existing.id }, data: { hidden: false } });
    return { ok: true };
  }

  if (!existing && !isDefaultFolder(parsed.data)) {
    await prisma.dataRoomFolder.create({
      data: { id: randomUUID(), projectId: project.id, name: parsed.data, hidden: false },
    });
  }

  return { ok: true };
}

export async function deleteDataRoomFolder(user: CurrentUser, name: string): Promise<DataRoomWriteResult> {
  const parsed = folderNameSchema.safeParse(name);
  const project = await ownedProject(user);

  if (!parsed.success || !project) {
    return { ok: false, message: parsed.success ? sellerCopy.documentForbidden : sellerCopy.folderInvalid };
  }

  const records = await prisma.dataRoomFolder.findMany({
    where: { projectId: project.id },
    select: { name: true, hidden: true },
  });
  const files = await prisma.dataRoomFile.findMany({
    where: { projectId: project.id },
    select: { folder: true },
  });
  const visible = visibleFolderNames({ records, usedByFiles: files.map((file) => file.folder) });

  if (!visible.includes(parsed.data)) {
    return { ok: false, message: dataRoomMessage("missing") };
  }

  await prisma.dataRoomFile.deleteMany({ where: { projectId: project.id, folder: parsed.data } });
  const standard = isDefaultFolder(parsed.data);

  if (standard) {
    await prisma.dataRoomFolder.upsert({
      where: { projectId_name: { projectId: project.id, name: parsed.data } },
      update: { hidden: true },
      create: { id: randomUUID(), projectId: project.id, name: parsed.data, hidden: true },
    });
  } else {
    await prisma.dataRoomFolder.deleteMany({ where: { projectId: project.id, name: parsed.data } });
  }

  return { ok: true };
}
