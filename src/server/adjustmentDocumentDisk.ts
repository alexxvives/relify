import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EbitdaAdjustment } from "@/lib/ebitda-adjustments";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const root = path.join(process.cwd(), "data", "adjustment-docs");

export const adjustmentDocumentByteLimit = 10 * 1024 * 1024;

const extensions = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt", "doc", "docx", "xls", "xlsx"]);

function pair(projectId: string, fileId: string): { bytes: string; name: string } | null {
  if (!idPattern.test(projectId) || !idPattern.test(fileId)) {
    return null;
  }
  const dir = path.join(root, projectId);
  return { bytes: path.join(dir, fileId), name: path.join(dir, `${fileId}.name`) };
}

export function adjustmentDocumentExtension(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extensions.has(extension) ? extension : null;
}

export function adjustmentDocumentIsStored(projectId: string, fileId: string): boolean {
  const target = pair(projectId, fileId);
  return target !== null && existsSync(target.bytes);
}

export async function missingAdjustmentDocument(projectId: string, rows: readonly EbitdaAdjustment[]): Promise<boolean> {
  return rows.some((row) => row.documentId !== null && !adjustmentDocumentIsStored(projectId, row.documentId));
}

export async function writeAdjustmentDocument(projectId: string, fileId: string, fileName: string, bytes: Uint8Array): Promise<boolean> {
  const target = pair(projectId, fileId);
  if (!target || bytes.byteLength === 0 || bytes.byteLength > adjustmentDocumentByteLimit || !adjustmentDocumentExtension(fileName)) {
    return false;
  }
  await mkdir(path.dirname(target.bytes), { recursive: true });
  await writeFile(target.bytes, bytes);
  await writeFile(target.name, fileName, "utf8");
  return true;
}

export async function readAdjustmentDocument(projectId: string, fileId: string): Promise<{ bytes: Buffer; fileName: string } | null> {
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
