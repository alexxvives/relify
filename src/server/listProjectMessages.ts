import { filesWithBytes, sharedFileIds } from "@/lib/data-room";
import { dealPipeline, investorProcessFiles, processFlags } from "@/lib/deal-pipeline";
import { ndaAccessGate } from "@/lib/project-access";
import { companyCopy } from "@/lib/company-copy";
import { labelAccesses, personName, toThreadMessage, type MessageCounts, type SellerThread, type SellerThreadStage } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { dataRoomFileIsStored } from "@/server/dataRoomDisk";
import { publicCardsByInvestor } from "@/server/investorProfile";
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
          select: { id: true, codename: true, slug: true },
        })
      : [];
    const ids = projects.map((project) => project.id);
    const codenameById = new Map(projects.map((project) => [project.id, project.codename]));
    const slugById = new Map(projects.map((project) => [project.id, project.slug]));

    if (ids.length === 0) {
      return { viewer: "seller", threads: [], counts: emptyCounts };
    }

    const [accesses, messages, files, grants, shares, fees, hired] = await Promise.all([
      prisma.projectAccess.findMany({
        where: { projectId: { in: ids }, cancelledAt: null },
        select: {
          id: true,
          investorId: true,
          projectId: true,
          requestedAt: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
          loiAcceptedAt: true,
          diligencePassedAt: true,
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
      prisma.advisoryEngagement.findMany({
        where: { projectId: { in: ids }, advisorId: { not: null }, depositPaidAt: { not: null }, declinedAt: null },
        select: { projectId: true },
      }),
    ]);
    const labeled = labelAccesses(accesses);
    const open = labeled.filter((access) => access.sellerAcceptedAt !== null && access.ndaAcceptedAt !== null);
    const openKey = new Set(open.map((access) => `${access.projectId}:${access.investorId}`));
    const visibleMessages = messages.filter((message) => openKey.has(`${message.projectId}:${message.investorId}`));
    const closedProjects = new Set(fees.map((fee) => fee.projectId));
    const hiredProjects = new Set(hired.map((row) => row.projectId));
    const investorIds = [...new Set(labeled.map((access) => access.investorId))];
    const people =
      investorIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: investorIds } },
            select: { id: true, email: true, name: true, lastName: true },
          });
    const nameById = new Map(people.map((person) => [person.id, personName(person.name, person.lastName)]));
    const profileById = await publicCardsByInvestor(people.map((person) => ({ id: person.id, email: person.email })));
    const threads = labeled.map((access) => {
      const stage: SellerThreadStage = access.sellerAcceptedAt === null ? "pending" : access.ndaAcceptedAt === null ? "nda" : "open";
      const threadMessages =
        stage === "open"
          ? visibleMessages.filter((message) => message.projectId === access.projectId && message.investorId === access.investorId)
          : [];

      const profile = profileById.get(access.investorId) ?? null;

      return {
        accessId: access.id,
        slug: slugById.get(access.projectId) ?? "",
        codename: codenameById.get(access.projectId) ?? "",
        label: nameById.get(access.investorId) || sellerCopy.investorParty,
        stage,
        profile,
        partyName: stage === "open" ? nameById.get(access.investorId) || sellerCopy.investorParty : sellerCopy.investorParty,
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
        steps: dealPipeline(
          "seller",
          processFlags({
            accepted: access.sellerAcceptedAt !== null,
            nda: access.ndaAcceptedAt !== null,
            questions: threadMessages.some((message) => message.kind === "question"),
            meeting: threadMessages.some((message) => message.kind === "meeting"),
            offer: threadMessages.some((message) => message.kind === "offer"),
            loiAccepted: access.loiAcceptedAt !== null,
            roomShared: grants.some((grant) => grant.projectId === access.projectId && grant.investorId === access.investorId),
            passedDiligence: access.diligencePassedAt !== null,
            closed: closedProjects.has(access.projectId),
          }),
        ),
        documents:
          stage === "open"
            ? filesWithBytes(
                files
                  .filter((file) => file.projectId === access.projectId)
                  .map((file) => ({
                    id: file.id,
                    folder: file.folder,
                    fileName: file.fileName,
                    stored: dataRoomFileIsStored(file.id),
                    visible: sharedFileIds({
                      files: files.filter((item) => item.projectId === access.projectId),
                      investorId: access.investorId,
                      granted: grants.some((grant) => grant.projectId === access.projectId && grant.investorId === access.investorId),
                      shares,
                    }).has(file.id),
                  })),
              )
            : [],
        advisorHired: hiredProjects.has(access.projectId),
      };
    });

    return { viewer: "seller", threads, counts: countsFor(visibleMessages, open.length) };
  }

  if (slug === null) {
    return { viewer: "investor", threads: [], counts: emptyCounts };
  }

  const project = await prisma.project.findFirst({
    where: { slug },
    select: { id: true, status: true, codename: true, ownerId: true },
  });
  const storedAccess = project
    ? await prisma.projectAccess.findUnique({
        where: { projectId_investorId: { projectId: project.id, investorId: user.id } },
        select: { sellerAcceptedAt: true, ndaAcceptedAt: true, loiAcceptedAt: true, diligencePassedAt: true, cancelledAt: true, id: true },
      })
    : null;
  const access = storedAccess && storedAccess.cancelledAt === null ? storedAccess : null;
  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    ndaAcceptedAt: access?.ndaAcceptedAt ?? null,
  });

  if (!gate.ok || !project) {
    return { viewer: "investor", threads: [], counts: emptyCounts };
  }

  const [messages, grant, fee, shareRows, owner] = await Promise.all([
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
    project.ownerId
      ? prisma.user.findUnique({
          where: { id: project.ownerId },
          select: { name: true, lastName: true },
        })
      : Promise.resolve(null),
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
    files: filesWithBytes(
      files
        .filter((file) => visible.has(file.id))
        .map((file) => ({ ...file, stored: dataRoomFileIsStored(file.id) })),
    ),
  });

  return {
    viewer: "investor",
    threads: [
      {
        accessId: access?.id ?? "",
        slug,
        codename: project.codename,
        label: project.codename,
        stage: "open",
        profile: null,
        partyName: owner ? personName(owner.name, owner.lastName) || companyCopy.companyParty : companyCopy.companyParty,
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
        steps: dealPipeline(
          "investor",
          processFlags({
            accepted: access?.sellerAcceptedAt !== null && access?.sellerAcceptedAt !== undefined,
            nda: access?.ndaAcceptedAt !== null && access?.ndaAcceptedAt !== undefined,
            questions: messages.some((message) => message.kind === "question"),
            meeting: messages.some((message) => message.kind === "meeting"),
            offer: messages.some((message) => message.kind === "offer"),
            loiAccepted: access?.loiAcceptedAt !== null && access?.loiAcceptedAt !== undefined,
            roomShared: grant !== null,
            passedDiligence: access?.diligencePassedAt !== null && access?.diligencePassedAt !== undefined,
            closed: fee !== null,
          }),
        ),
        documents,
        advisorHired: false,
      },
    ],
    counts: countsFor(messages, access?.ndaAcceptedAt ? 1 : 0),
  };
}
