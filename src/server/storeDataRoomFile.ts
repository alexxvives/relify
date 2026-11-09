import { randomUUID } from "node:crypto";
import {
  dataRoomMessage,
  dataRoomReadGate,
  renameDataRoomFileSchema,
  visibleFolderNames,
  type StoreDataRoomFileInput,
} from "@/lib/data-room";
import {
  relevaDraftFolder,
  relevaDraftPdf,
  relevaDrafts,
} from "@/lib/releva-drafts";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { deleteDataRoomBytes, writeDataRoomBytes } from "@/server/dataRoomDisk";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type DataRoomWriteResult = { ok: true } | { ok: false; message: string };

export async function storeDataRoomFile(
  user: CurrentUser,
  input: StoreDataRoomFileInput,
  bytes: Uint8Array,
): Promise<DataRoomWriteResult> {
  // Import at function level to avoid circular dependency
  const { assertUploadsEnabled } = await import("./int-guards");
  assertUploadsEnabled();

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
    return {
      ok: false,
      message: dataRoomMessage(gate.ok ? "missing" : gate.code),
    };
  }

  const [records, used] = await Promise.all([
    prisma.dataRoomFolder.findMany({
      where: { projectId: project.id },
      select: { name: true, hidden: true },
    }),
    prisma.dataRoomFile.findMany({
      where: { projectId: project.id },
      select: { folder: true },
    }),
  ]);

  if (
    !visibleFolderNames({
      records,
      usedByFiles: used.map((file) => file.folder),
    }).includes(input.folder)
  ) {
    return { ok: false, message: sellerCopy.folderInvalid };
  }

  const id = randomUUID();
  const written = await writeDataRoomBytes(id, bytes);

  if (!written) {
    return { ok: false, message: sellerCopy.documentInvalid };
  }

  try {
    await prisma.dataRoomFile.create({
      data: {
        id,
        projectId: project.id,
        fileName: input.fileName,
        folder: input.folder,
      },
    });
  } catch {
    await deleteDataRoomBytes(id);
    return { ok: false, message: sellerCopy.documentFailed };
  }

  return { ok: true };
}

export async function renameDataRoomFile(
  user: CurrentUser,
  fileId: string,
  fileName: string,
): Promise<DataRoomWriteResult> {
  const parsed = renameDataRoomFileSchema.safeParse({ fileId, fileName });

  if (!parsed.success || !user.onboarded || user.role !== "seller") {
    return {
      ok: false,
      message: parsed.success
        ? sellerCopy.documentForbidden
        : sellerCopy.documentInvalid,
    };
  }

  const draft = relevaDrafts.find((item) => item.id === parsed.data.fileId);

  if (draft) {
    const pdf = relevaDraftPdf(draft.id);
    const activeId = await activeSellerProjectId(user.id);
    const project = activeId
      ? await prisma.project.findFirst({
          where: { id: activeId, ownerId: user.id },
          select: { id: true },
        })
      : null;

    if (!pdf || !project) {
      return { ok: false, message: sellerCopy.documentForbidden };
    }

    const existing = await prisma.dataRoomFile.findFirst({
      where: {
        projectId: project.id,
        folder: relevaDraftFolder,
        fileName: draft.fileName,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.dataRoomFile.create({
        data: {
          id: randomUUID(),
          projectId: project.id,
          folder: relevaDraftFolder,
          fileName: draft.fileName,
        },
      });
    }

    return storeDataRoomFile(
      user,
      { folder: relevaDraftFolder, fileName: parsed.data.fileName },
      pdf.bytes,
    );
  }

  const activeId = await activeSellerProjectId(user.id);
  const file = await prisma.dataRoomFile.findFirst({
    where: {
      id: parsed.data.fileId,
      project: { id: activeId ?? "", ownerId: user.id },
    },
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

  await prisma.dataRoomFile.update({
    where: { id: file.id },
    data: { fileName: parsed.data.fileName },
  });
  return { ok: true };
}
