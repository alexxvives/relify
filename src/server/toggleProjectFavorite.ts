import { randomUUID } from "node:crypto";
import { companyCopy } from "@/lib/company-copy";
import { favoriteDecision } from "@/lib/project-favorite";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type FavoriteResult =
  { ok: true; favorited: boolean } | { ok: false; message: string };

export async function toggleProjectFavorite(
  user: CurrentUser,
  slug: string,
): Promise<FavoriteResult> {
  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, status: true },
  });
  const existing = project
    ? await prisma.projectFavorite.findUnique({
        where: {
          projectId_investorId: { projectId: project.id, investorId: user.id },
        },
        select: { id: true },
      })
    : null;
  const decision = favoriteDecision({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    alreadySaved: existing !== null,
  });

  if (!decision.ok || !project) {
    return { ok: false, message: companyCopy.favoriteFailed };
  }

  if (decision.action === "remove" && existing) {
    await prisma.projectFavorite.delete({ where: { id: existing.id } });
    return { ok: true, favorited: false };
  }

  if (decision.action === "add") {
    await prisma.projectFavorite.create({
      data: { id: randomUUID(), projectId: project.id, investorId: user.id },
    });
  }

  return { ok: true, favorited: true };
}

export async function listFavoriteSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.projectFavorite.findMany({
    where: { investorId: userId },
    select: { project: { select: { slug: true } } },
  });

  return rows.map((row) => row.project.slug);
}
