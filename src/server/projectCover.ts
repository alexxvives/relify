import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeImageUpload } from "@/lib/file-bytes";
import { assertUploadsEnabled } from "./int-guards";

const root = path.join(process.cwd(), "data", "project-covers");
const idPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const byteLimit = 8 * 1024 * 1024;

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type CoverType = keyof typeof extensions;

function isCoverType(value: string): value is CoverType {
  return (
    value === "image/jpeg" || value === "image/png" || value === "image/webp"
  );
}

function coverPath(id: string, extension: string): string | null {
  if (!idPattern.test(id)) {
    return null;
  }

  return path.join(root, `${id}.${extension}`);
}

export function findProjectCover(
  id: string,
): { filePath: string; type: CoverType } | null {
  if (!idPattern.test(id)) {
    return null;
  }

  for (const [type, extension] of Object.entries(extensions) as [
    CoverType,
    string,
  ][]) {
    const target = coverPath(id, extension);

    if (target && existsSync(target)) {
      return { filePath: target, type };
    }
  }

  return null;
}

export function projectCoverIsStored(id: string): boolean {
  return findProjectCover(id) !== null;
}

export function projectCoverVersion(id: string): string | null {
  const found = findProjectCover(id);

  if (!found) {
    return null;
  }

  return String(Math.round(statSync(found.filePath).mtimeMs));
}

export function projectCoverHref(slug: string, version: string): string {
  return `/portadas/${slug}?v=${version}`;
}

export async function writeProjectCover(
  id: string,
  type: string,
  bytes: Uint8Array,
): Promise<boolean> {
  assertUploadsEnabled();
  const prepared = sanitizeImageUpload(bytes);
  if (
    !prepared ||
    !isCoverType(prepared.mime) ||
    (type !== "" && !isCoverType(type)) ||
    prepared.bytes.byteLength === 0 ||
    prepared.bytes.byteLength > byteLimit
  ) {
    return false;
  }

  const target = coverPath(id, extensions[prepared.mime]);

  if (!target) {
    return false;
  }

  await mkdir(root, { recursive: true });

  for (const extension of Object.values(extensions)) {
    if (extension === extensions[prepared.mime]) {
      continue;
    }

    const previous = coverPath(id, extension);

    if (!previous) {
      continue;
    }

    try {
      await unlink(previous);
    } catch {
      // A missing older file is the normal case.
    }
  }

  await writeFile(target, prepared.bytes);
  return true;
}

export async function deleteProjectCover(id: string): Promise<void> {
  if (!idPattern.test(id)) {
    return;
  }

  for (const extension of Object.values(extensions)) {
    const target = coverPath(id, extension);
    if (!target) {
      continue;
    }

    try {
      await unlink(target);
    } catch {
      // Already gone.
    }
  }
}

export async function readProjectCover(
  id: string,
): Promise<{ bytes: Buffer; type: CoverType } | null> {
  const found = findProjectCover(id);

  if (!found) {
    return null;
  }

  try {
    return { bytes: await readFile(found.filePath), type: found.type };
  } catch {
    return null;
  }
}
