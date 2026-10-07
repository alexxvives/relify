import { readMeeting, withMeetingNotes, withMeetingStatus } from "@/lib/meeting";
import { sellerReplyGate } from "@/lib/project-message";
import { ndaAccessGate } from "@/lib/project-access";
import { companyCopy } from "@/lib/company-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type MeetingNotesResult = { ok: true } | { ok: false; message: string };

export async function updateMeetingNotes(
  user: CurrentUser,
  input: { messageId: string; notes: string; slug?: string; accessId?: string },
): Promise<MeetingNotesResult> {
  const message = await prisma.projectMessage.findUnique({
    where: { id: input.messageId },
    select: {
      id: true,
      author: true,
      kind: true,
      body: true,
      investorId: true,
      project: { select: { id: true, slug: true, ownerId: true, status: true } },
    },
  });
  if (!message || message.kind !== "meeting") {
    return { ok: false, message: companyCopy.messageInvalid };
  }

  const slot = readMeeting(message.body);

  if (!slot || slot.status !== "scheduled") {
    return { ok: false, message: slot ? sellerCopy.meetingsNotesLocked : companyCopy.messageInvalid };
  }

  const next = withMeetingNotes(message.body, input.notes);

  if (!next) {
    return { ok: false, message: companyCopy.messageInvalid };
  }

  if (input.slug) {
    const access = await prisma.projectAccess.findUnique({
      where: { projectId_investorId: { projectId: message.project.id, investorId: user.id } },
      select: { ndaAcceptedAt: true, sellerAcceptedAt: true },
    });
    const gate = ndaAccessGate({
      onboarded: user.onboarded,
      role: user.role,
      projectStatus: message.project.status,
      ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
    });

    if (
      !gate.ok ||
      message.project.slug !== input.slug ||
      message.investorId !== user.id ||
      access?.sellerAcceptedAt === null ||
      access?.sellerAcceptedAt === undefined
    ) {
      return { ok: false, message: companyCopy.messageInvalid };
    }
  } else if (input.accessId) {
    const access = await prisma.projectAccess.findUnique({
      where: { id: input.accessId },
      select: { id: true, investorId: true, ndaAcceptedAt: true, sellerAcceptedAt: true, projectId: true },
    });
    const gate = sellerReplyGate({
      onboarded: user.onboarded,
      role: user.role,
      ownsProject: message.project.ownerId === user.id,
      ndaAccepted: access?.ndaAcceptedAt !== null && access?.ndaAcceptedAt !== undefined,
      sellerAccepted: access?.sellerAcceptedAt !== null && access?.sellerAcceptedAt !== undefined,
    });

    if (!gate.ok || !access || access.projectId !== message.project.id || access.investorId !== message.investorId) {
      return { ok: false, message: gate.ok ? sellerCopy.replyInvalid : sellerCopy.replyForbidden };
    }
  } else {
    return { ok: false, message: companyCopy.messageInvalid };
  }

  await prisma.projectMessage.update({ where: { id: message.id }, data: { body: next } });
  return { ok: true };
}

export async function approveMeeting(
  user: CurrentUser,
  input: { messageId: string; slug?: string; accessId?: string },
): Promise<MeetingNotesResult> {
  const message = await prisma.projectMessage.findUnique({
    where: { id: input.messageId },
    select: {
      id: true,
      author: true,
      kind: true,
      body: true,
      investorId: true,
      project: { select: { id: true, slug: true, ownerId: true, status: true } },
    },
  });
  const slot = message && message.kind === "meeting" ? readMeeting(message.body) : null;

  if (!message || !slot) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  if (slot.status === "scheduled") {
    return { ok: true };
  }

  const authored =
    (message.author === "investor" && message.investorId === user.id) ||
    (message.author === "seller" && message.project.ownerId === user.id);

  if (authored) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  if (input.slug) {
    const access = await prisma.projectAccess.findUnique({
      where: { projectId_investorId: { projectId: message.project.id, investorId: user.id } },
      select: { ndaAcceptedAt: true, sellerAcceptedAt: true },
    });
    const gate = ndaAccessGate({
      onboarded: user.onboarded,
      role: user.role,
      projectStatus: message.project.status,
      ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
    });

    if (
      !gate.ok ||
      message.project.slug !== input.slug ||
      message.investorId !== user.id ||
      access?.sellerAcceptedAt === null ||
      access?.sellerAcceptedAt === undefined
    ) {
      return { ok: false, message: sellerCopy.meetingsAcceptFailed };
    }
  } else if (input.accessId) {
    const access = await prisma.projectAccess.findUnique({
      where: { id: input.accessId },
      select: { id: true, investorId: true, ndaAcceptedAt: true, sellerAcceptedAt: true, projectId: true },
    });
    const gate = sellerReplyGate({
      onboarded: user.onboarded,
      role: user.role,
      ownsProject: message.project.ownerId === user.id,
      ndaAccepted: access?.ndaAcceptedAt !== null && access?.ndaAcceptedAt !== undefined,
      sellerAccepted: access?.sellerAcceptedAt !== null && access?.sellerAcceptedAt !== undefined,
    });

    if (!gate.ok || !access || access.projectId !== message.project.id || access.investorId !== message.investorId) {
      return { ok: false, message: sellerCopy.meetingsAcceptFailed };
    }
  } else {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const next = withMeetingStatus(message.body, "scheduled");

  if (!next) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  await prisma.projectMessage.update({ where: { id: message.id }, data: { body: next } });
  return { ok: true };
}
