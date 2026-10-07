import { sharedFileIds } from "@/lib/data-room";
import { dealPipeline, investorProcessFiles } from "@/lib/deal-pipeline";
import { ndaAccessGate } from "@/lib/project-access";
import { labelAccesses, toThreadMessage, type MessageCounts, type SellerThread } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type MessageList = {
  viewer: "seller" | "investor" | "none";
  threads: SellerThread[];
  counts: MessageCounts;
};

const emptyCounts: MessageCounts = { accepted: 0, questionsIn: 0, questionsOut: 0, meetings: 0 };

function countsFor(
  messages: { author: "seller" | "investor"; kind: "question" | "meeting" | "offer" }[],
  accepted: number,
): MessageCounts {
  return {
    accepted,
    questionsIn: messages.filter((message) => message.author === "investor" && message.kind === "question").length,
    questionsOut: messages.filter((message) => message.author === "seller" && message.kind === "question").length,
    meetings: messages.filter((message) => message.kind === "meeting").length,
  };
}

export async function listProjectMessages(user: CurrentUser, slug: string | null): Promise<MessageList> {
  if (!user.onboarded || user.role === "advisor" || user.role === "admin" || user.role === null) {
    return { viewer: "none", threads: [], counts: emptyCounts };
  }

  if (user.role === "seller") {
    const activeId = await activeSellerProjectId(user.id);
    const projects = activeId
      ? await prisma.project.findMany({
          where: { id: activeId, ownerId: user.id },
          select: { id: true, codename: true },
        })
      : [];
    const ids = projects.map((project) => project.id);
    const codenameById = new Map(projects.map((project) => [project.id, project.codename]));

    if (ids.length === 0) {
      return { viewer: "seller", threads: [], counts: emptyCounts };
    }

    const [accesses, messages, files, grants, shares, fees] = await Promise.all([
      prisma.projectAccess.findMany({
        where: { projectId: { in: ids } },
        select: {
          id: true,
          investorId: true,
          projectId: true,
          requestedAt: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
        },
        orderBy: { requestedAt: "asc" },
      }),
      prisma.projectMessage.findMany({
        where: { projectId: { in: ids } },
        select: { id: true, projectId: true, investorId: true, author: true, kind: true, body: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.dataRoomFile.findMany({
        where: { projectId: { in: ids } },
        select: { id: true, projectId: true, folder: true, fileName: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.dataRoomGrant.findMany({
        where: { projectId: { in: ids } },
        select: { projectId: true, investorId: true },
      }),
      prisma.dataRoomFileShare.findMany({
        where: { file: { projectId: { in: ids } } },
        select: { fileId: true, investorId: true },
      }),
      prisma.successFee.findMany({
        where: { projectId: { in: ids } },
        select: { projectId: true },
      }),
    ]);
    const open = labelAccesses(accesses).filter((access) => access.sellerAcceptedAt !== null && access.ndaAcceptedAt !== null);
    const openKey = new Set(open.map((access) => `${access.projectId}:${access.investorId}`));
    const visibleMessages = messages.filter((message) => openKey.has(`${message.projectId}:${message.investorId}`));
    const closedProjects = new Set(fees.map((fee) => fee.projectId));
    const threads = open.map((access) => {
      const threadMessages = visibleMessages.filter(
        (message) => message.projectId === access.projectId && message.investorId === access.investorId,
      );

      return {
        accessId: access.id,
        codename: codenameById.get(access.projectId) ?? "",
        label: access.label,
        messages: threadMessages.map((message) =>
          toThreadMessage({
            id: message.id,
            kind: message.kind,
            body: message.body,
            author: message.author,
            viewer: "seller",
            createdAt: message.createdAt,
          }),
        ),
        steps: dealPipeline("seller", {
          accepted: access.sellerAcceptedAt !== null,
          nda: access.ndaAcceptedAt !== null,
          questions: threadMessages.some((message) => message.kind === "question"),
          meeting: threadMessages.some((message) => message.kind === "meeting"),
          offer: threadMessages.some((message) => message.kind === "offer"),
          documents: grants.some((grant) => grant.projectId === access.projectId && grant.investorId === access.investorId),
          closed: closedProjects.has(access.projectId),
        }),
        documents: files
          .filter((file) => file.projectId === access.projectId)
          .map((file) => ({
            folder: file.folder,
            fileName: file.fileName,
            visible: sharedFileIds({
              files: files.filter((item) => item.projectId === access.projectId),
              investorId: access.investorId,
              granted: grants.some((grant) => grant.projectId === access.projectId && grant.investorId === access.investorId),
              shares,
            }).has(file.id),
          })),
      };
    });

    return { viewer: "seller", threads, counts: countsFor(visibleMessages, open.length) };
  }

  if (slug === null) {
    return { viewer: "investor", threads: [], counts: emptyCounts };
  }

  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, status: true, codename: true },
  });
  const access = project
    ? await prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
        select: { sellerAcceptedAt: true, ndaAcceptedAt: true },
      })
    : null;
  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
  });

  if (!gate.ok || !project) {
    return { viewer: "investor", threads: [], counts: emptyCounts };
  }

  const [messages, grant, fee, shareRows] = await Promise.all([
    prisma.projectMessage.findMany({
      where: { projectId: project.id, investorId: user.id },
      select: { id: true, author: true, kind: true, body: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dataRoomGrant.findUnique({
      where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
      select: { id: true },
    }),
    prisma.successFee.findUnique({
      where: { projectId: project.id },
      select: { id: true },
    }),
    prisma.dataRoomFileShare.findMany({
      where: { investorId: user.id, file: { projectId: project.id } },
      select: { fileId: true, investorId: true },
    }),
  ]);
  const files =
    grant === null
      ? []
      : await prisma.dataRoomFile.findMany({
          where: { projectId: project.id },
          select: { id: true, folder: true, fileName: true },
          orderBy: { createdAt: "asc" },
        });
  const visible = sharedFileIds({
    files,
    investorId: user.id,
    granted: grant !== null,
    shares: shareRows,
  });
  const documents = investorProcessFiles({
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
    granted: grant !== null,
    files: files.filter((file) => visible.has(file.id)),
  });

  return {
    viewer: "investor",
    threads: [
      {
        accessId: "",
        codename: project.codename,
        label: project.codename,
        messages: messages.map((message) =>
          toThreadMessage({
            id: message.id,
            kind: message.kind,
            body: message.body,
            author: message.author,
            viewer: "investor",
            createdAt: message.createdAt,
          }),
        ),
        steps: dealPipeline("investor", {
          accepted: access?.sellerAcceptedAt !== null && access?.sellerAcceptedAt !== undefined,
          nda: access?.ndaAcceptedAt !== null && access?.ndaAcceptedAt !== undefined,
          questions: messages.some((message) => message.kind === "question"),
          meeting: messages.some((message) => message.kind === "meeting"),
          offer: messages.some((message) => message.kind === "offer"),
          documents: grant !== null,
          closed: fee !== null,
        }),
        documents,
      },
    ],
    counts: countsFor(messages, access?.ndaAcceptedAt ? 1 : 0),
  };
}
