import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isIntEnvironment } from "@/lib/int-env";
import { assertUploadsEnabled } from "./int-guards";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const prodRoot = path.join(process.cwd(), "data", "data-room");
const intRoot = path.join(prodRoot, "int");

export const dataRoomByteLimit = 20 * 1024 * 1024;

type IntUploadsBucket = {
  put: (key: string, value: ArrayBuffer | Uint8Array) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>;
  head: (key: string) => Promise<unknown | null>;
  delete: (key: string) => Promise<unknown>;
};

function diskRoot(): string {
  return isIntEnvironment() ? intRoot : prodRoot;
}

function filePath(id: string): string | null {
  if (!idPattern.test(id)) {
    return null;
  }

  return path.join(diskRoot(), id);
}

function intObjectKey(id: string): string {
  return `int/${id}`;
}

async function intUploadsBucket(): Promise<IntUploadsBucket | null> {
  if (!isIntEnvironment()) {
    return null;
  }

  try {
    const workers = await import("cloudflare:workers");
    const bound = (workers.env as Record<string, unknown>).INT_UPLOADS;
    if (
      bound &&
      typeof bound === "object" &&
      "put" in bound &&
      "get" in bound &&
      "head" in bound &&
      "delete" in bound
    ) {
      return bound as IntUploadsBucket;
    }
  } catch {
    return null;
  }

  return null;
}

export async function dataRoomFileIsStored(id: string): Promise<boolean> {
  const target = filePath(id);
  if (target !== null && existsSync(target)) {
    return true;
  }

  const bucket = await intUploadsBucket();
  if (!bucket || !idPattern.test(id)) {
    return false;
  }

  try {
    return (await bucket.head(intObjectKey(id))) !== null;
  } catch {
    return false;
  }
}

export async function dataRoomStoredIds(ids: readonly string[]): Promise<Set<string>> {
  const unique = [...new Set(ids)];
  const pairs = await Promise.all(unique.map(async (id) => [id, await dataRoomFileIsStored(id)] as const));
  return new Set(pairs.filter(([, ok]) => ok).map(([id]) => id));
}

/** Bytes live on disk locally. INT Workers use the INT_UPLOADS R2 binding (releva-int-uploads). */
export async function writeDataRoomBytes(
  id: string,
  bytes: Uint8Array,
): Promise<boolean> {
  assertUploadsEnabled();
  const target = filePath(id);

  if (
    !target ||
    bytes.byteLength === 0 ||
    bytes.byteLength > dataRoomByteLimit
  ) {
    return false;
  }

  const bucket = await intUploadsBucket();
  if (bucket) {
    await bucket.put(intObjectKey(id), bytes);
    return true;
  }

  await mkdir(diskRoot(), { recursive: true });
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
    const bucket = await intUploadsBucket();
    if (!bucket) {
      return null;
    }
    try {
      const object = await bucket.get(intObjectKey(id));
      if (!object) {
        return null;
      }
      return Buffer.from(await object.arrayBuffer());
    } catch {
      return null;
    }
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
    // Disk miss is fine: INT may only have the R2 object.
  }

  const bucket = await intUploadsBucket();
  if (!bucket) {
    return;
  }

  try {
    await bucket.delete(intObjectKey(id));
  } catch {
    return;
  }
}
