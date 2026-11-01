import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const root = path.join(process.cwd(), "data", "data-room");

export const dataRoomByteLimit = 20 * 1024 * 1024;

function filePath(id: string): string | null {
  if (!idPattern.test(id)) {
    return null;
  }

  return path.join(root, id);
}

export function dataRoomFileIsStored(id: string): boolean {
  const target = filePath(id);
  return target !== null && existsSync(target);
}

export async function writeDataRoomBytes(
  id: string,
  bytes: Uint8Array,
): Promise<boolean> {
  const target = filePath(id);

  if (
    !target ||
    bytes.byteLength === 0 ||
    bytes.byteLength > dataRoomByteLimit
  ) {
    return false;
  }

  await mkdir(root, { recursive: true });
  await writeFile(target, bytes);
  return true;
}

export async function readDataRoomBytes(id: string): Promise<Buffer | null> {
  const target = filePath(id);

  if (!target) {
    return null;
  }

  try {
    return await readFile(target);
  } catch {
    return null;
  }
}

export async function deleteDataRoomBytes(id: string): Promise<void> {
  const target = filePath(id);

  if (!target) {
    return;
  }

  try {
    await unlink(target);
  } catch {
    return;
  }
}
