import { visibleFolderNames } from "@/lib/data-room";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { shareAdvisorDocuments } from "@/server/advisoryEngagement";
import { setDataRoomFileShare } from "@/server/setDataRoomFileShare";
import type { DataRoomWriteResult } from "@/server/storeDataRoomFile";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function shareDataRoomScope(
  user: CurrentUser,
  input: {
    scope: string;
    fileId: string;
    folder: string;
    accessId: string;
    engagementId: string;
    shared: boolean;
  },
): Promise<DataRoomWriteResult> {
  const scope = input.scope === "file" || input.scope === "folder" || input.scope === "room" ? input.scope : null;
  const investor = input.accessId.length > 0;
  const advisor = input.engagementId.length > 0;

  if (!scope || investor === advisor) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  if (advisor) {
    if (!idPattern.test(input.engagementId) || (scope === "file" && !idPattern.test(input.fileId))) {
      return { ok: false, message: sellerCopy.shareFailed };
    }

    const result = await shareAdvisorDocuments(user, {
      engagementId: input.engagementId,
      scope,
      fileId: input.fileId,
      folder: input.folder,
      shared: input.shared,
    });

    return result.ok ? { ok: true } : { ok: false, message: result.message };
  }

  if (!idPattern.test(input.accessId) || (scope === "file" && !idPattern.test(input.fileId))) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  if (scope === "file") {
    return setDataRoomFileShare(user, { fileId: input.fileId, accessId: input.accessId, shared: input.shared });
  }

  const access = await prisma.projectAccess.findUnique({
    where: { id: input.accessId },
    select: { project: { select: { id: true, ownerId: true } } },
  });

  if (!access || access.project.ownerId !== user.id) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  const [files, folderRows] = await Promise.all([
    prisma.dataRoomFile.findMany({
      where: { projectId: access.project.id },
      select: { id: true, folder: true },
    }),
    prisma.dataRoomFolder.findMany({
      where: { projectId: access.project.id },
      select: { name: true, hidden: true },
    }),
  ]);
  const names = visibleFolderNames({ records: folderRows, usedByFiles: files.map((file) => file.folder) });
  const chosen =
    scope === "folder"
      ? files.filter((file) => file.folder === input.folder && names.includes(file.folder))
      : files.filter((file) => names.includes(file.folder));

  if (scope === "folder" && !names.includes(input.folder)) {
    return { ok: false, message: sellerCopy.shareFailed };
  }

  for (const file of chosen) {
    const result = await setDataRoomFileShare(user, { fileId: file.id, accessId: input.accessId, shared: input.shared });
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}
