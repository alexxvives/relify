import { randomUUID } from "node:crypto";
import { advisorMessageLeavesPlatform } from "@/lib/advisor-directory";
import { advisoryServices } from "@/lib/advisory";
import type { ProcessFile } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { engagementCopy } from "@/lib/engagement-copy";
import { meetingBody, proposeMeetingChange, readMeeting, withMeetingStatus } from "@/lib/meeting";
import type { MessageKindName, ThreadMessageView } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { dataRoomFileIsStored } from "@/server/dataRoomDisk";
import { investorVisibleFiles } from "@/server/investorVisibleFiles";
import { recordNotification } from "@/server/recordNotification";

export type EngagementWriteResult = { ok: true } | { ok: false; message: string };

type Side = "client" | "advisor";

function serviceLabel(ids: string[]): string {
  return ids
    .map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id)
    .join(", ");
}

function asKind(kind: string): MessageKindName {
  if (kind === "question" || kind === "meeting" || kind === "offer") {
    return kind;
  }

  return "question";
}

function toMessage(input: {
  id: string;
  kind: string;
  body: string;
  author: Side;
  side: Side;
  createdAt: Date;
}): ThreadMessageView {
  return {
    id: input.id,
    kind: asKind(input.kind),
    body: input.body,
    mine: input.author === input.side,
    createdAt: input.createdAt.toISOString(),
  };
}

async function sharedFiles(engagement: {
  id: string;
  client: "investor" | "seller";
  requesterId: string;
  projectId: string;
}): Promise<ProcessFile[]> {
  if (engagement.client === "investor") {
    const files = await investorVisibleFiles(engagement.requesterId, engagement.projectId);
    return files.filter((file) => dataRoomFileIsStored(file.id)).map((file) => ({ ...file, stored: true, visible: true }));
  }

  const [folders, shares] = await Promise.all([
    prisma.advisorFolderOpen.findMany({
      where: { engagementId: engagement.id },
      select: { folder: true },
    }),
    prisma.advisorFileShare.findMany({
      where: { engagementId: engagement.id },
      select: { file: { select: { id: true, folder: true, fileName: true } } },
    }),
  ]);
  const names = folders.map((folder) => folder.folder);
  const folderFiles =
    names.length === 0
      ? []
      : await prisma.dataRoomFile.findMany({
          where: { projectId: engagement.projectId, folder: { in: names } },
          select: { id: true, folder: true, fileName: true },
        });
  const byId = new Map<string, { id: string; folder: string; fileName: string }>();

  for (const file of folderFiles) {
    byId.set(file.id, file);
  }

  for (const share of shares) {
    byId.set(share.file.id, share.file);
  }

  return [...byId.values()]
    .filter((file) => dataRoomFileIsStored(file.id))
    .map((file) => ({ ...file, stored: true, visible: true }));
}

async function loadSide(user: CurrentUser, engagementId: string): Promise<{
  id: string;
  requesterId: string;
  advisorId: string;
  client: "investor" | "seller";
  services: string[];
  projectId: string;
  codename: string;
  region: string;
  side: Side;
} | null> {
  if (!user.onboarded) {
    return null;
  }

  const row = await prisma.advisoryEngagement.findUnique({
    where: { id: engagementId },
    select: {
      id: true,
      requesterId: true,
      advisorId: true,
      client: true,
      services: true,
      depositPaidAt: true,
      declinedAt: true,
      projectId: true,
      project: { select: { codename: true, region: true } },
    },
  });

  if (!row?.advisorId || row.declinedAt) {
    return null;
  }

  const side = row.requesterId === user.id ? "client" : row.advisorId === user.id ? "advisor" : null;

  if (!side) {
    return null;
  }

  if (side === "client" && user.role !== "investor" && user.role !== "seller") {
    return null;
  }

  if (side === "advisor" && (user.role !== "advisor" || row.depositPaidAt === null)) {
    return null;
  }

  return {
    id: row.id,
    requesterId: row.requesterId,
    advisorId: row.advisorId,
    client: row.client,
    services: row.services,
    projectId: row.projectId,
    codename: row.project.codename,
    region: row.project.region,
    side,
  };
}

function viewOf(
  row: {
    id: string;
    client: "investor" | "seller";
    services: string[];
    codename: string;
    region: string;
    side: Side;
  },
  messages: ThreadMessageView[],
  documents: ProcessFile[],
): AdvisorContactView {
  const clientLabel = row.client === "investor" ? engagementCopy.fromInvestor : engagementCopy.fromSeller;

  return {
    id: row.id,
    heading: row.side === "client" ? engagementCopy.advisorFallback : row.codename,
    detail: row.side === "client" ? `${row.codename} · ${row.region}` : row.region,
    services: serviceLabel(row.services),
    partyName: row.side === "client" ? engagementCopy.advisorFallback : clientLabel,
    placeholder:
      row.side === "client"
        ? engagementCopy.threadPlaceholder
        : row.client === "investor"
          ? engagementCopy.threadPlaceholderInvestor
          : engagementCopy.threadPlaceholderSeller,
    viewer: row.side === "advisor" ? "seller" : row.client,
    messages,
    documents,
  };
}

async function messagesFor(engagementId: string, side: Side): Promise<ThreadMessageView[]> {
  const rows = await prisma.engagementMessage.findMany({
    where: { engagementId },
    orderBy: { createdAt: "asc" },
    select: { id: true, kind: true, body: true, author: true, createdAt: true },
  });

  return rows.map((message) =>
    toMessage({
      id: message.id,
      kind: message.kind,
      body: message.body,
      author: message.author,
      side,
      createdAt: message.createdAt,
    }),
  );
}

export async function listClientContacts(user: CurrentUser): Promise<AdvisorContactView[]> {
  if (!user.onboarded || (user.role !== "investor" && user.role !== "seller")) {
    return [];
  }

  const rows = await prisma.advisoryEngagement.findMany({
    where: { requesterId: user.id, advisorId: { not: null }, declinedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      client: true,
      services: true,
      projectId: true,
      requesterId: true,
      project: { select: { codename: true, region: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, kind: true, body: true, author: true, createdAt: true },
      },
    },
  });
  const contacts: AdvisorContactView[] = [];

  for (const row of rows) {
    const documents = await sharedFiles(row);
    contacts.push(
      viewOf(
        {
          id: row.id,
          client: row.client,
          services: row.services,
          codename: row.project.codename,
          region: row.project.region,
          side: "client",
        },
        row.messages.map((message) =>
          toMessage({
            id: message.id,
            kind: message.kind,
            body: message.body,
            author: message.author,
            side: "client",
            createdAt: message.createdAt,
          }),
        ),
        documents,
      ),
    );
  }

  return contacts;
}

export async function getEngagementThread(user: CurrentUser, engagementId: string): Promise<AdvisorContactView | null> {
  const row = await loadSide(user, engagementId);

  if (!row) {
    return null;
  }

  const [messages, documents] = await Promise.all([messagesFor(row.id, row.side), sharedFiles(row)]);
  return viewOf(row, messages, documents);
}

async function notifyOther(row: {
  requesterId: string;
  advisorId: string;
  codename: string;
  side: Side;
  id: string;
  client: "investor" | "seller";
}): Promise<void> {
  const toAdvisor = row.side === "client";

  await recordNotification({
    userId: toAdvisor ? row.advisorId : row.requesterId,
    title: toAdvisor ? engagementCopy.threadNoticeAdvisor : engagementCopy.threadNoticeClient,
    body: row.codename,
    href: toAdvisor ? `/mandatos/encargos/${row.id}` : row.client === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });
}

export async function postEngagementMessage(
  user: CurrentUser,
  input: { engagementId: string; kind: "question" | "meeting"; body: string },
): Promise<EngagementWriteResult> {
  const row = await loadSide(user, input.engagementId);

  if (!row) {
    return { ok: false, message: engagementCopy.missing };
  }

  if (advisorMessageLeavesPlatform(input.body)) {
    return { ok: false, message: engagementCopy.stayOnPlatform };
  }

  let body = input.body;

  if (input.kind === "meeting") {
    const slot = readMeeting(input.body);

    if (!slot) {
      return { ok: false, message: sellerCopy.meetingsAcceptFailed };
    }

    const stamped = meetingBody({
      ...slot,
      status: "proposed",
      proposedBy: row.side === "client" ? "investor" : "seller",
    });

    if (!stamped) {
      return { ok: false, message: sellerCopy.meetingsAcceptFailed };
    }

    body = stamped;
  }

  await prisma.engagementMessage.create({
    data: {
      id: randomUUID(),
      engagementId: row.id,
      author: row.side,
      kind: input.kind,
      body,
    },
  });
  await notifyOther(row);
  return { ok: true };
}

export async function approveEngagementMeeting(
  user: CurrentUser,
  input: { engagementId: string; messageId: string },
): Promise<EngagementWriteResult> {
  const row = await loadSide(user, input.engagementId);

  if (!row) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const message = await prisma.engagementMessage.findFirst({
    where: { id: input.messageId, engagementId: row.id, kind: "meeting" },
    select: { id: true, body: true, author: true },
  });
  const slot = message ? readMeeting(message.body) : null;

  if (!message || !slot) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  if (slot.status === "scheduled") {
    return { ok: true };
  }

  const proposedBy = slot.proposedBy ?? (message.author === "client" ? "investor" : "seller");
  const authored = (proposedBy === "investor" && row.side === "client") || (proposedBy === "seller" && row.side === "advisor");

  if (authored) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const next = withMeetingStatus(message.body, "scheduled");

  if (!next) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  await prisma.engagementMessage.update({ where: { id: message.id }, data: { body: next } });
  await notifyOther(row);
  return { ok: true };
}

export async function rescheduleEngagementMeeting(
  user: CurrentUser,
  input: { engagementId: string; messageId: string; body: string },
): Promise<EngagementWriteResult> {
  const row = await loadSide(user, input.engagementId);

  if (!row) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const message = await prisma.engagementMessage.findFirst({
    where: { id: input.messageId, engagementId: row.id, kind: "meeting" },
    select: { id: true, body: true },
  });
  const draft = readMeeting(input.body);

  if (!message || !draft || !readMeeting(message.body)) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  const next = proposeMeetingChange(message.body, draft, row.side === "client" ? "investor" : "seller");

  if (!next) {
    return { ok: false, message: sellerCopy.meetingsAcceptFailed };
  }

  await prisma.engagementMessage.update({ where: { id: message.id }, data: { body: next } });
  await notifyOther(row);
  return { ok: true };
}
