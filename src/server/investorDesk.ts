import { sharedFileIds } from "@/lib/data-room";
import { dealPipeline, investorProcessFiles, processFlags, type DealStep, type ProcessFile } from "@/lib/deal-pipeline";
import { investorCopy } from "@/lib/investor-copy";
import { demoInvestorProfile } from "@/lib/demo-profile";
import { toThreadMessage, type ThreadMessageView } from "@/lib/project-message";
import { prisma } from "@/server/db";

export type InvestorProcessCard = {
  slug: string;
  codename: string;
  region: string;
  stage: string;
  open: boolean;
  nda: boolean;
  steps: DealStep[];
  messages: ThreadMessageView[];
  documents: ProcessFile[];
  documentsNote: string;
};

export type InvestorProfileChecks = {
  thesis: boolean;
  filters: boolean;
  hidden: boolean;
  favorite: boolean;
  premium: boolean;
};

export type InvestorDesk = {
  pending: InvestorProcessCard[];
  processes: InvestorProcessCard[];
  favorites: number;
  interests: number;
  questions: number;
  meetings: number;
  profileChecks: InvestorProfileChecks;
};

function stageFor(access: { sellerAcceptedAt: Date | null; ndaAcceptedAt: Date | null }): { stage: string; open: boolean } {
  if (access.ndaAcceptedAt) {
    return { stage: investorCopy.stageNda, open: false };
  }

  if (access.sellerAcceptedAt) {
    return { stage: investorCopy.stageMatched, open: true };
  }

  return { stage: investorCopy.stageWaiting, open: true };
}

export async function loadInvestorDesk(userId: string, email: string, plan: string): Promise<InvestorDesk> {
  const [accesses, favorites, questions, meetings] = await Promise.all([
    prisma.projectAccess.findMany({
      where: { investorId: userId, project: { status: "published" } },
      select: {
        sellerAcceptedAt: true,
        ndaAcceptedAt: true,
        project: {
          select: {
            id: true,
            slug: true,
            codename: true,
            region: true,
            successFee: { select: { id: true } },
            dataRoomGrants: {
              where: { investorId: userId },
              select: { id: true },
            },
            messages: {
              where: { investorId: userId },
              select: { id: true, author: true, kind: true, body: true, createdAt: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.projectFavorite.count({ where: { investorId: userId } }),
    prisma.projectMessage.count({ where: { investorId: userId, author: "investor", kind: "question" } }),
    prisma.projectMessage.count({ where: { investorId: userId, kind: "meeting" } }),
  ]);
  const sharedIds = accesses
    .filter((access) => access.ndaAcceptedAt !== null && access.project.dataRoomGrants.length > 0)
    .map((access) => access.project.id);
  const sharedFiles =
    sharedIds.length === 0
      ? []
      : await prisma.dataRoomFile.findMany({
          where: { projectId: { in: sharedIds } },
          select: { id: true, projectId: true, folder: true, fileName: true },
          orderBy: { createdAt: "asc" },
        });
  const shareRows =
    sharedIds.length === 0
      ? []
      : await prisma.dataRoomFileShare.findMany({
          where: { investorId: userId, file: { projectId: { in: sharedIds } } },
          select: { fileId: true, investorId: true },
        });
  const processes = accesses.map((access) => {
    const stage = stageFor(access);
    const granted = access.project.dataRoomGrants.length > 0;
    const projectFiles = sharedFiles.filter((file) => file.projectId === access.project.id);
    const visible = sharedFileIds({ files: projectFiles, investorId: userId, granted, shares: shareRows });
    const documents = investorProcessFiles({
      ndaAcceptedAt: access.ndaAcceptedAt,
      granted,
      files: projectFiles.filter((file) => visible.has(file.id)),
    });
    const documentsNote =
      access.ndaAcceptedAt === null || !granted
        ? investorCopy.documentsLocked
        : documents.length === 0
          ? investorCopy.documentsEmpty
          : "";

    return {
      slug: access.project.slug,
      codename: access.project.codename,
      region: access.project.region,
      stage: stage.stage,
      open: stage.open,
      nda: access.ndaAcceptedAt !== null,
      steps: dealPipeline(
        "investor",
        processFlags({
          accepted: access.sellerAcceptedAt !== null,
          nda: access.ndaAcceptedAt !== null,
          questions: access.project.messages.some((message) => message.kind === "question"),
          meeting: access.project.messages.some((message) => message.kind === "meeting"),
          offer: access.project.messages.some((message) => message.kind === "offer"),
          roomShared: granted,
          closed: access.project.successFee !== null,
        }),
      ),
      messages: access.project.messages.map((message) =>
        toThreadMessage({
          id: message.id,
          kind: message.kind,
          body: message.body,
          author: message.author,
          viewer: "investor",
          createdAt: message.createdAt,
        }),
      ),
      documents,
      documentsNote,
    };
  });
  const profile = demoInvestorProfile(email);

  return {
    pending: processes.filter((process) => process.open),
    processes,
    favorites,
    interests: accesses.length,
    questions,
    meetings,
    profileChecks: {
      thesis: profile !== null,
      filters: false,
      hidden: false,
      favorite: favorites > 0,
      premium: plan !== "none",
    },
  };
}
