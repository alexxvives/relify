import { randomUUID } from "node:crypto";
import { accessRequestedNotice, incomingAccessNotice } from "@/lib/notifications";
import { accessMessage, requestAccessOutcome, type ProjectAccessInput } from "@/lib/project-access";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type ProjectAccessResult = { ok: true } | { ok: false; message: string };

export async function requestProjectAccess(user: CurrentUser, input: ProjectAccessInput): Promise<ProjectAccessResult> {
  const project = await prisma.project.findFirst({
    where: { slug: input.slug },
    select: { id: true, status: true, codename: true, ownerId: true, slug: true },
  });

  const existing = project
    ? await prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
        select: { id: true },
      })
    : null;

  const outcome = requestAccessOutcome({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    alreadyRequested: existing !== null,
  });

  if (!outcome.ok || !project) {
    return { ok: false, message: accessMessage(outcome.ok ? "missing" : outcome.code) };
  }

  if (outcome.insert) {
    await prisma.projectAccess.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        investorId: user.id,
      },
    });
    const href = `/proyectos/${project.slug}`;
    const investorNotice = accessRequestedNotice(project.codename);
    await recordNotification({ userId: user.id, ...investorNotice, href });

    if (project.ownerId && project.ownerId !== user.id) {
      const sellerNotice = incomingAccessNotice(project.codename);
      await recordNotification({ userId: project.ownerId, ...sellerNotice, href: "/mi-empresa" });
    }
  }

  return { ok: true };
}
