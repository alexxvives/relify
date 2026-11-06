import { existsSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { adjustmentDocumentByteLimit, adjustmentDocumentExtension, type EbitdaAdjustment } from "@/lib/ebitda-adjustments";
import { prisma } from "@/server/db";

const projectIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const fileIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const root = path.join(process.cwd(), "data", "adjustment-docs");

export type AdjustmentDocumentWrite = "ok" | "type" | "size" | "failed";

function pair(projectId: string, fileId: string): { bytes: string; name: string } | null {
  if (!projectIdPattern.test(projectId) || !fileIdPattern.test(fileId)) {
    return null;
  }
  const dir = path.join(root, projectId);
  return { bytes: path.join(dir, fileId), name: path.join(dir, `${fileId}.name`) };
}

export async function adjustmentDocumentIsStored(projectId: string, fileId: string): Promise<boolean> {
  if (!projectIdPattern.test(projectId) || !fileIdPattern.test(fileId)) {
    return false;
  }
  const row = await prisma.adjustmentDocument.findFirst({ where: { id: fileId, projectId }, select: { id: true } });
  if (row) {
    return true;
  }
  const target = pair(projectId, fileId);
  return target !== null && existsSync(target.bytes);
}

export async function missingAdjustmentDocument(projectId: string, rows: readonly EbitdaAdjustment[]): Promise<boolean> {
  for (const row of rows) {
    if (row.documentId !== null && !(await adjustmentDocumentIsStored(projectId, row.documentId))) {
      return true;
    }
  }
  return false;
}

export async function writeAdjustmentDocument(
  projectId: string,
  fileId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<AdjustmentDocumentWrite> {
  if (!projectIdPattern.test(projectId) || !fileIdPattern.test(fileId)) {
    return "failed";
  }
  if (!adjustmentDocumentExtension(fileName)) {
    return "type";
  }
  if (bytes.byteLength === 0 || bytes.byteLength > adjustmentDocumentByteLimit) {
    return "size";
  }
  try {
    await prisma.adjustmentDocument.create({
      data: { id: fileId, projectId, fileName, bytes: Buffer.from(bytes) },
    });
    return "ok";
  } catch {
    return "failed";
  }
}

export async function readAdjustmentDocument(projectId: string, fileId: string): Promise<{ bytes: Buffer; fileName: string } | null> {
  if (!projectIdPattern.test(projectId) || !fileIdPattern.test(fileId)) {
    return null;
  }
  const row = await prisma.adjustmentDocument.findFirst({
    where: { id: fileId, projectId },
    select: { bytes: true, fileName: true },
  });
  if (row) {
    const name = row.fileName.replace(/[\r\n]/g, "").trim();
    return { bytes: Buffer.from(row.bytes), fileName: name.length > 0 ? name : "documento" };
  }
  const target = pair(projectId, fileId);
  if (!target) {
    return null;
  }
  try {
    const [bytes, fileName] = await Promise.all([readFile(target.bytes), readFile(target.name, "utf8")]);
    const name = fileName.replace(/[\r\n]/g, "").trim();
    return { bytes, fileName: name.length > 0 ? name : "documento" };
  } catch {
    return null;
  }
}

export async function deleteAdjustmentDocument(projectId: string, fileId: string): Promise<void> {
  if (projectIdPattern.test(projectId) && fileIdPattern.test(fileId)) {
    await prisma.adjustmentDocument.deleteMany({ where: { id: fileId, projectId } });
  }
  const target = pair(projectId, fileId);
  if (!target) {
    return;
  }
  await unlink(target.bytes).catch(() => undefined);
  await unlink(target.name).catch(() => undefined);
}

export async function deleteUnusedAdjustmentDocuments(
  projectId: string,
  previous: readonly EbitdaAdjustment[],
  next: readonly EbitdaAdjustment[],
): Promise<void> {
  const kept = new Set(next.flatMap((row) => (row.documentId ? [row.documentId] : [])));
  for (const row of previous) {
    if (row.documentId && !kept.has(row.documentId)) {
      await deleteAdjustmentDocument(projectId, row.documentId);
    }
  }
}
