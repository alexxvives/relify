import { randomUUID } from "node:crypto";
import { accessCopy } from "@/lib/access-copy";
import {
  accessRequestedNotice,
  incomingAccessNotice,
} from "@/lib/notifications";
import {
  accessMessage,
  requestAccessOutcome,
  type ProjectAccessInput,
} from "@/lib/project-access";
import { buyerMatchSlot } from "@/server/buyerPlan";
import { buyerProfileComplete } from "@/server/investorProfile";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type ProjectAccessResult = { ok: true } | { ok: false; message: string };

export async function requestProjectAccess(
  user: CurrentUser,
  input: ProjectAccessInput,
): Promise<ProjectAccessResult> {
  if (!(await buyerProfileComplete(user.id, user.email))) {
    return { ok: false, message: accessCopy.profileRequired };
  }

  const project = await prisma.project.findFirst({
    where: { slug: input.slug },
    select: {
      id: true,
      status: true,
      codename: true,
      ownerId: true,
      slug: true,
      successFee: { select: { id: true } },
    },
  });

  if (project?.successFee) {
    return { ok: false, message: "Esta empresa ya se ha vendido." };
  }

  const existing = project
    ? await prisma.projectAccess.findUnique({
        where: {
          projectId_investorId: { projectId: project.id, investorId: user.id },
        },
        select: { id: true, cancelledAt: true },
      })
    : null;

  if (existing?.cancelledAt && project) {
    const slot = await buyerMatchSlot(user.id);
    if (!slot.ok) {
      return {
        ok: false,
        message:
          slot.code === "plan"
            ? accessCopy.planRequired
            : accessCopy.matchLimit,
      };
    }
    // A reconnect after a cancel is a fresh process: drop the previous run's
    // chat/LOI messages and data-room access so no stale state leaks back in.
    const scope = { projectId: project.id, investorId: user.id };
    await prisma.$transaction([
      prisma.projectMessage.deleteMany({ where: scope }),
      prisma.dataRoomGrant.deleteMany({ where: scope }),
      prisma.dataRoomFileShare.deleteMany({
        where: { investorId: user.id, file: { projectId: project.id } },
      }),
      prisma.projectAccess.update({
        where: { id: existing.id },
        data: {
          cancelledAt: null,
          cancelledBy: null,
          sellerAcceptedAt: null,
          ndaAcceptedAt: null,
          loiAcceptedAt: null,
          diligencePassedAt: null,
          ndaSignature: null,
          requestedAt: new Date(),
        },
      }),
    ]);
    const href = `/proyectos/${project.slug}`;
    const investorNotice = accessRequestedNotice(project.codename);
    await recordNotification({ userId: user.id, ...investorNotice, href });
    if (project.ownerId && project.ownerId !== user.id) {
      const sellerNotice = incomingAccessNotice(project.codename);
      await recordNotification({
        userId: project.ownerId,
        ...sellerNotice,
        href: "/mi-empresa/procesos",
      });
    }
    return { ok: true };
  }

  const outcome = requestAccessOutcome({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    alreadyRequested: existing !== null,
  });

  if (!outcome.ok || !project) {
    return {
      ok: false,
      message: accessMessage(outcome.ok ? "missing" : outcome.code),
    };
  }

  if (outcome.insert) {
    const slot = await buyerMatchSlot(user.id);

    if (!slot.ok) {
      return {
        ok: false,
        message:
          slot.code === "plan"
            ? accessCopy.planRequired
            : accessCopy.matchLimit,
      };
    }

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
      const owner = await prisma.user.findUnique({
        where: { id: project.ownerId },
        select: { role: true },
      });
      const sellerNotice = incomingAccessNotice(project.codename);
      const ownerHref =
        owner?.role === "advisor" ? "/mandatos/venta" : "/mi-empresa/procesos";
      await recordNotification({
        userId: project.ownerId,
        ...sellerNotice,
        href: ownerHref,
      });
    }
  }

  return { ok: true };
}
