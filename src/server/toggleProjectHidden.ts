import { randomUUID } from "node:crypto";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type HiddenResult = { ok: true; hidden: boolean } | { ok: false; message: string };

/** Hides or shows one published company in this investor's Mercado. Idempotent for the target state. */
export async function setProjectHidden(user: CurrentUser, slug: string, hidden: boolean): Promise<HiddenResult> {
  if (user.role !== "investor") {
    return { ok: false, message: "Solo los inversores pueden ocultar empresas." };
  }
  const project = await prisma.project.findFirst({ where: { slug }, select: { id: true } });
  if (!project) {
    return { ok: false, message: "No hemos encontrado esa empresa." };
  }
  const key = { projectId_investorId: { projectId: project.id, investorId: user.id } };
  if (hidden) {
    await prisma.projectHidden.upsert({
      where: key,
      create: { id: randomUUID(), projectId: project.id, investorId: user.id },
      update: {},
    });
  } else {
    await prisma.projectHidden.deleteMany({ where: { projectId: project.id, investorId: user.id } });
  }
  return { ok: true, hidden };
}

export async function listHiddenSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.projectHidden.findMany({
    where: { investorId: userId },
    select: { project: { select: { slug: true } } },
  });
  return rows.map((row) => row.project.slug);
}
