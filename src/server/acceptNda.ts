import { incomingNdaNotice, ndaAcceptedNotice } from "@/lib/notifications";
import { accessMessage, acceptNdaOutcome, ndaAccessGate, type ProjectAccessInput } from "@/lib/project-access";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";
import type { ProjectAccessResult } from "@/server/requestProjectAccess";

export async function acceptNda(user: CurrentUser, input: ProjectAccessInput): Promise<ProjectAccessResult> {
  const project = await prisma.project.findFirst({
    where: { slug: input.slug },
    select: { id: true, status: true, codename: true, ownerId: true, slug: true },
  });

  const existing = project
    ? await prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
        select: { id: true, ndaAcceptedAt: true },
      })
    : null;

  const outcome = acceptNdaOutcome({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    requested: existing !== null,
    alreadyAccepted: existing !== null && existing.ndaAcceptedAt !== null,
  });

  if (!outcome.ok || !project || !existing) {
    return { ok: false, message: accessMessage(outcome.ok ? "missing" : outcome.code) };
  }

  const acceptedAt = existing.ndaAcceptedAt ?? new Date();

  if (outcome.stamp) {
    await prisma.projectAccess.update({
      where: { id: existing.id },
      data: { ndaAcceptedAt: acceptedAt },
    });
    const href = `/proyectos/${project.slug}`;
    const investorNotice = ndaAcceptedNotice(project.codename);
    await recordNotification({ userId: user.id, ...investorNotice, href });

    if (project.ownerId && project.ownerId !== user.id) {
      const sellerNotice = incomingNdaNotice(project.codename);
      await recordNotification({ userId: project.ownerId, ...sellerNotice, href: "/mi-empresa" });
    }
  }

  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project.status,
    ndaAcceptedAt: acceptedAt,
  });

  if (!gate.ok) {
    return { ok: false, message: accessMessage(gate.code) };
  }

  return { ok: true };
}
