import { randomUUID } from "node:crypto";
import { sanitizeImageUpload } from "@/lib/file-bytes";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { assertUploadsEnabled } from "./int-guards";

/** t84: seller gallery limits. Photos are resized in the browser before upload, so 2 MB is plenty. */
export const projectPhotoLimit = 6;
export const projectPhotoBytes = 2 * 1024 * 1024;
const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProjectPhotoRef = { id: string; hidden: boolean };

export function projectPhotoHref(id: string): string {
  return `/fotos/${id}`;
}

export async function listProjectPhotos(projectId: string, includeHidden: boolean): Promise<ProjectPhotoRef[]> {
  return prisma.projectPhoto.findMany({
    where: { projectId, ...(includeHidden ? {} : { hidden: false }) },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, hidden: true },
  });
}

export type AddPhotoResult = { ok: true; added: number } | { ok: false; reason: "limit" | "type" | "size" };

export async function addProjectPhotos(projectId: string, files: { type: string; bytes: Uint8Array }[]): Promise<AddPhotoResult> {
  assertUploadsEnabled();
  const count = await prisma.projectPhoto.count({ where: { projectId } });
  if (count + files.length > projectPhotoLimit) {
    return { ok: false, reason: "limit" };
  }
  const cleaned: { mime: string; bytes: Uint8Array }[] = [];
  for (const file of files) {
    if (file.bytes.byteLength === 0 || file.bytes.byteLength > projectPhotoBytes) return { ok: false, reason: "size" };
    const prepared = sanitizeImageUpload(file.bytes);
    if (!prepared || !photoTypes.has(prepared.mime) || (file.type !== "" && !photoTypes.has(file.type))) {
      return { ok: false, reason: "type" };
    }
    cleaned.push(prepared);
  }
  await prisma.projectPhoto.createMany({
    data: cleaned.map((file, index) => ({ id: randomUUID(), projectId, mime: file.mime, bytes: Buffer.from(file.bytes), position: count + index })),
  });
  return { ok: true, added: files.length };
}

export async function deleteProjectPhoto(projectId: string, photoId: string): Promise<boolean> {
  const result = await prisma.projectPhoto.deleteMany({ where: { id: photoId, projectId } });
  return result.count > 0;
}

/** Admin moderation: a hidden photo stays stored but only admin and the owner can load it. */
export async function setProjectPhotoHidden(
  user: CurrentUser,
  photoId: string,
  hidden: boolean,
): Promise<string | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }
  const row = await prisma.projectPhoto.update({ where: { id: photoId }, data: { hidden }, select: { project: { select: { slug: true } } } }).catch(() => null);
  return row?.project.slug ?? null;
}

export async function readProjectPhoto(photoId: string) {
  return prisma.projectPhoto.findUnique({
    where: { id: photoId },
    select: { mime: true, bytes: true, hidden: true, project: { select: { status: true, ownerId: true } } },
  });
}
