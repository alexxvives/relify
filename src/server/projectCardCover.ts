import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { deleteProjectCover, projectCoverHref, projectCoverIsStored, projectCoverVersion, readProjectCover } from "@/server/projectCover";
import { projectPhotoBytes, projectPhotoHref, projectPhotoLimit } from "@/server/projectPhotos";

/**
 * t86: one photo source. The marketplace card cover is the first visible project photo; the old single
 * file cover (t6x "Subir fotos") is only a fallback until it is merged into the project photos.
 */
export async function cardCovers(projects: { id: string; slug: string }[]): Promise<Map<string, string | null>> {
  const ids = projects.map((project) => project.id);
  const rows = ids.length
    ? await prisma.projectPhoto.findMany({
        where: { projectId: { in: ids }, hidden: false },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, projectId: true },
      })
    : [];
  const first = new Map<string, string>();
  for (const row of rows) {
    if (!first.has(row.projectId)) first.set(row.projectId, row.id);
  }
  return new Map(
    projects.map((project) => {
      const photo = first.get(project.id);
      if (photo) return [project.id, projectPhotoHref(photo)];
      const version = projectCoverIsStored(project.id) ? projectCoverVersion(project.id) : null;
      return [project.id, version ? projectCoverHref(project.slug, version) : null];
    }),
  );
}

export async function cardCover(project: { id: string; slug: string }): Promise<string | null> {
  return (await cardCovers([project])).get(project.id) ?? null;
}

/**
 * Moves an old file cover into the project photos as the first photo, so nothing is lost when the two
 * uploaders become one. Keeps the file when it cannot be moved (too large, gallery full).
 */
export async function mergeLegacyCover(projectId: string): Promise<void> {
  if (!projectCoverIsStored(projectId)) return;
  const cover = await readProjectCover(projectId);
  if (!cover || cover.bytes.byteLength > projectPhotoBytes) return;
  const photos = await prisma.projectPhoto.findMany({ where: { projectId }, select: { position: true }, orderBy: { position: "asc" } });
  if (photos.length >= projectPhotoLimit) return;
  await prisma.projectPhoto.create({
    data: { id: randomUUID(), projectId, mime: cover.type, bytes: Buffer.from(cover.bytes), position: (photos[0]?.position ?? 1) - 1 },
  });
  await deleteProjectCover(projectId);
}
