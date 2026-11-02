import { loadPublishChecks } from "@/server/publishChecks";
import * as z from "zod";
import { adminCopy } from "@/lib/admin-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { emailOwnerPublished } from "@/server/emailNotices";

const projectIdSchema = z.string().trim().min(1).max(128);

export type AdminMutation =
  { ok: true; message: string } | { ok: false; message: string };

export async function approveProject(
  user: CurrentUser,
  projectId: string,
): Promise<AdminMutation> {
  if (!user.onboarded || user.role !== "admin") {
    return { ok: false, message: adminCopy.forbidden };
  }

  const parsed = projectIdSchema.safeParse(projectId);

  if (!parsed.success) {
    return { ok: false, message: adminCopy.invalid };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data },
    select: { id: true, status: true, ownerId: true, codename: true },
  });

  if (!project) {
    return { ok: false, message: adminCopy.missingProject };
  }

  if (project.status !== "pending") {
    return { ok: false, message: adminCopy.notPending };
  }

  // t75: approval is the safety net; it still enforces the financial checks and EBITDA > 0.
  const checks = await loadPublishChecks(project.id);

  if (!checks || !checks.admin.ready) {
    return { ok: false, message: `No se puede publicar. Falta: ${(checks?.admin.missing ?? []).join(", ") || "comprobar los datos"}.` };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "published" },
  });
  await emailOwnerPublished(project.ownerId, project.codename);

  return { ok: true, message: adminCopy.approved };
}
