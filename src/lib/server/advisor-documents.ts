import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorDocumentHref, type AdvisorDocumentView } from "@/lib/advisor-documents";
import { dataRoomUploadAllowed } from "@/lib/file-bytes";
import { dataRoomByteLimit, deleteDataRoomBytes, readDataRoomBytes, writeDataRoomBytes } from "@/lib/server/data-room-disk";

export type AdvisorDocumentResult = { ok: true } | { ok: false; message: string };

const nameLimit = 120;

export async function listAdvisorDocuments(userId: string): Promise<AdvisorDocumentView[]> {
  const rows = await prisma.advisorDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true },
  });
  return rows.map((row) => ({ ...row, href: advisorDocumentHref(row.id) }));
}

/** Same checks as a data-room upload: a plain file name, an allowed type that matches its bytes, 20 MB at most. */
export async function storeAdvisorDocument(userId: string, rawName: string, bytes: Uint8Array): Promise<AdvisorDocumentResult> {
  const fileName = rawName.split(/[/\\]/).pop()?.trim() ?? "";

  if (fileName === "" || fileName.length > nameLimit || bytes.byteLength === 0) {
    return { ok: false, message: advisorCopy.documentInvalid };
  }

  if (bytes.byteLength > dataRoomByteLimit) {
    return { ok: false, message: advisorCopy.documentTooLarge };
  }

  if (!dataRoomUploadAllowed(fileName, bytes)) {
    return { ok: false, message: advisorCopy.documentInvalid };
  }

  const id = randomUUID();

  if (!(await writeDataRoomBytes(id, bytes))) {
    return { ok: false, message: advisorCopy.documentFailed };
  }

  try {
    await prisma.advisorDocument.create({ data: { id, userId, fileName } });
  } catch {
    await deleteDataRoomBytes(id);
    return { ok: false, message: advisorCopy.documentFailed };
  }

  return { ok: true };
}

export async function deleteAdvisorDocument(userId: string, id: string): Promise<AdvisorDocumentResult> {
  const { count } = await prisma.advisorDocument.deleteMany({ where: { id, userId } });

  if (count === 0) {
    return { ok: false, message: advisorCopy.documentFailed };
  }

  await deleteDataRoomBytes(id);
  return { ok: true };
}

/** Only the advisor who uploaded the file can read it. */
export async function readAdvisorDocument(userId: string, id: string): Promise<{ fileName: string; bytes: Buffer } | null> {
  const row = await prisma.advisorDocument.findFirst({ where: { id, userId }, select: { fileName: true } });

  if (!row) {
    return null;
  }

  const bytes = await readDataRoomBytes(id);
  return bytes ? { fileName: row.fileName, bytes } : null;
}
