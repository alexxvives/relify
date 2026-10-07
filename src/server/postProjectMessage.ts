import { randomUUID } from "node:crypto";
import { accessMessage, ndaAccessGate } from "@/lib/project-access";
import {
  investorNoticeFor,
  messageFailure,
  messageTab,
  sellerReplyGate,
  type InvestorMessageInput,
  type SellerMessageInput,
} from "@/lib/project-message";
import { sellerReplyNotice } from "@/lib/notifications";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { recordNotification } from "@/server/recordNotification";

export type MessageWriteResult = { ok: true } | { ok: false; message: string };

export async function postInvestorMessage(
  user: CurrentUser,
  input: InvestorMessageInput,
): Promise<MessageWriteResult> {
  const project = await prisma.project.findFirst({
    where: { slug: input.slug },
    select: { id: true, status: true, codename: true, ownerId: true, slug: true },
  });
  const access = project
    ? await prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
        select: { ndaAcceptedAt: true, sellerAcceptedAt: true },
      })
    : null;
  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
  });

  if (!gate.ok || !project || !access) {
    return { ok: false, message: accessMessage(gate.ok ? "missing" : gate.code) };
  }

  if (access.sellerAcceptedAt === null) {
    return { ok: false, message: accessMessage("waiting") };
  }

  await prisma.projectMessage.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      investorId: user.id,
      author: "investor",
      kind: input.kind,
      body: input.body,
    },
  });
  if (project.ownerId && project.ownerId !== user.id) {
    await recordNotification({
      userId: project.ownerId,
      ...investorNoticeFor(input.kind, project.codename),
      href: "/mi-empresa/procesos",
    });
  }

  return { ok: true };
}

export async function postSellerMessage(user: CurrentUser, input: SellerMessageInput): Promise<MessageWriteResult> {
  const access = await prisma.projectAccess.findUnique({
    where: { id: input.accessId },
    select: {
      investorId: true,
      ndaAcceptedAt: true,
      sellerAcceptedAt: true,
      project: { select: { id: true, ownerId: true, codename: true, slug: true } },
    },
  });
  const outcome = sellerReplyGate({
    onboarded: user.onboarded,
    role: user.role,
    ownsProject: access !== null && access.project.ownerId === user.id,
    sellerAccepted: access !== null && access.sellerAcceptedAt !== null,
    ndaAccepted: access !== null && access.ndaAcceptedAt !== null,
  });

  if (!outcome.ok || !access) {
    return { ok: false, message: messageFailure(outcome.ok ? "missing" : outcome.code, "seller") };
  }

  await prisma.projectMessage.create({
    data: {
      id: randomUUID(),
      projectId: access.project.id,
      investorId: access.investorId,
      author: "seller",
      kind: input.kind,
      body: input.body,
    },
  });
  await recordNotification({
    userId: access.investorId,
    ...sellerReplyNotice(access.project.codename),
    href: `/proyectos/${access.project.slug}?tab=${messageTab[input.kind]}`,
  });

  return { ok: true };
}
