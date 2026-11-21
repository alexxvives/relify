import { randomUUID } from "node:crypto";
import { anonymousInvestorLabel, messageTab, personName, sellerMessageSchema, toThreadMessage, type ThreadMessageView } from "@/lib/project-message";
import { incomingQuestionNotice, sellerReplyNotice } from "@/lib/notifications";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { recordNotification } from "@/lib/server/record-notification";
import { prisma } from "@/lib/db";

// S38 (Alex): the asesor talks in the process chats like the party that hired them.
// Seller-hired: every buyer conversation of that company. Buyer-hired: only the
// client's own conversation with the seller. Messages keep the client's side as
// author and record advisor_id, so both parties see "Asesor" on them.

export type AdvisorChatScope = { side: "seller" | "investor"; projectId: string; investorId: string | null };

export type AdvisorProcessChat = {
  accessId: string;
  label: string;
  messages: ThreadMessageView[];
};

type EngagementGate = {
  advisorId: string | null;
  depositPaidAt: Date | null;
  declinedAt: Date | null;
  client: "seller" | "investor";
  requesterId: string;
  projectId: string;
};

/** Pure: which process chats this asesor may use (null = none). Paid, accepted encargo of this asesor only. */
export function advisorChatScope(user: { id: string; role: string | null; onboarded: boolean }, row: EngagementGate | null): AdvisorChatScope | null {
  if (!row || !user.onboarded || user.role !== "advisor" || row.advisorId !== user.id || !row.depositPaidAt || row.declinedAt) {
    return null;
  }
  return {
    side: row.client,
    projectId: row.projectId,
    investorId: row.client === "investor" ? row.requesterId : null,
  };
}

async function scopeFor(user: CurrentUser, engagementId: string): Promise<AdvisorChatScope | null> {
  const row = await prisma.advisoryEngagement.findUnique({
    where: { id: engagementId },
    select: { advisorId: true, depositPaidAt: true, declinedAt: true, client: true, requesterId: true, projectId: true },
  });
  return advisorChatScope(user, row);
}

/** Live processes where the seller accepted the buyer and the NDA is signed (same gate as the seller's reply). */
function openAccessWhere(scope: AdvisorChatScope) {
  return {
    projectId: scope.projectId,
    cancelledAt: null,
    sellerAcceptedAt: { not: null },
    ndaAcceptedAt: { not: null },
    ...(scope.investorId ? { investorId: scope.investorId } : {}),
  };
}

export type AdvisorProcessChats = { side: "seller" | "investor"; chats: AdvisorProcessChat[] };

export async function listAdvisorProcessChats(user: CurrentUser, engagementId: string): Promise<AdvisorProcessChats | null> {
  const scope = await scopeFor(user, engagementId);
  if (!scope) {
    return null;
  }
  const accesses = await prisma.projectAccess.findMany({
    where: openAccessWhere(scope),
    orderBy: { requestedAt: "asc" },
    select: { id: true, investorId: true, investor: { select: { name: true, lastName: true } } },
  });
  if (accesses.length === 0) {
    return { side: scope.side, chats: [] };
  }
  const messages = await prisma.projectMessage.findMany({
    where: { projectId: scope.projectId, kind: "question", investorId: { in: accesses.map((row) => row.investorId) } },
    orderBy: { createdAt: "asc" },
    select: { id: true, investorId: true, kind: true, body: true, author: true, advisorId: true, createdAt: true },
  });
  const chats = accesses.map((access, index) => ({
    accessId: access.id,
    // S41 (Alex): the buyer's real name everywhere (filters, cards), for the advisor and the seller alike.
    label: scope.side === "seller" ? personName(access.investor.name, access.investor.lastName).trim() || anonymousInvestorLabel(index + 1) : "Vendedor",
    messages: messages
      .filter((message) => message.investorId === access.investorId)
      .map((message) =>
        toThreadMessage({ ...message, viewer: scope.side, advisorId: message.advisorId }),
      ),
  }));
  return { side: scope.side, chats };
}

export type AdvisorPostResult = { ok: true } | { ok: false; message: string };

export async function postAdvisorProcessMessage(
  user: CurrentUser,
  engagementId: string,
  input: { accessId: string; body: string },
): Promise<AdvisorPostResult> {
  const parsed = sellerMessageSchema.safeParse({ accessId: input.accessId, kind: "question", body: input.body });
  const scope = await scopeFor(user, engagementId);
  if (!parsed.success || !scope) {
    return { ok: false, message: "No se ha podido enviar el mensaje." };
  }
  const access = await prisma.projectAccess.findFirst({
    where: { id: parsed.data.accessId, ...openAccessWhere(scope) },
    select: { investorId: true, project: { select: { id: true, ownerId: true, codename: true, slug: true } } },
  });
  if (!access) {
    return { ok: false, message: "No se ha podido enviar el mensaje." };
  }
  await prisma.projectMessage.create({
    data: {
      id: randomUUID(),
      projectId: access.project.id,
      investorId: access.investorId,
      author: scope.side,
      advisorId: user.id,
      kind: "question",
      body: parsed.data.body,
    },
  });
  // Counterpart gets the usual aviso; the client sees it in the same chat.
  if (scope.side === "seller") {
    await recordNotification({
      userId: access.investorId,
      ...sellerReplyNotice(access.project.codename),
      href: `/proyectos/${access.project.slug}?tab=${messageTab.question}`,
    });
  } else if (access.project.ownerId) {
    await recordNotification({
      userId: access.project.ownerId,
      ...incomingQuestionNotice(access.project.codename),
      href: "/mi-empresa/procesos",
    });
  }
  return { ok: true };
}
