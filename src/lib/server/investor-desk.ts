import { sharedFileIds } from "@/lib/data-room";
import {
  dealPipeline,
  investorProcessFiles,
  processFlags,
  type DealStep,
  type ProcessFile,
  withContractAccepted,
} from "@/lib/deal-pipeline";
import { companyCopy } from "@/lib/company-copy";
import { investorCopy } from "@/lib/investor-copy";
import { investorProfileChecks } from "@/lib/demo-profile";
import { toThreadMessage, type ThreadMessageView } from "@/lib/project-message";
import { formatWholeEur } from "@/lib/money";
import type { ContractView } from "@/lib/sale-contract";
import { contractStageOpen, contractViews } from "@/lib/server/sale-contract";
import { prisma } from "@/lib/db";
import { buyerClosed, type BuyerClosed } from "@/lib/server/sale-outcome";
import { loadInvestorDraft } from "@/lib/server/investor-profile";

export type InvestorProcessCard = {
  accessId: string;
  slug: string;
  codename: string;
  region: string;
  askingPrice: string;
  stage: string;
  open: boolean;
  nda: boolean;
  sellerAccepted: boolean;
  steps: DealStep[];
  messages: ThreadMessageView[];
  documents: ProcessFile[];
  documentsNote: string;
  partyName: string;
  advisorHired: boolean;
  contract: ContractView | null;
  lastReadAt: string | null;
  closed: BuyerClosed | null;
};

export type InvestorProfileChecks = {
  photo: boolean;
  place: boolean;
  kind: boolean;
  search: boolean;
  offer: boolean;
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

function personName(name: string, lastName: string | null): string {
  return [name, lastName ?? ""]
    .filter((part) => part.trim().length > 0)
    .join(" ");
}

function stageFor(access: {
  sellerAcceptedAt: Date | null;
  ndaAcceptedAt: Date | null;
}): { stage: string; open: boolean } {
  if (access.ndaAcceptedAt) {
    return { stage: investorCopy.stageNda, open: false };
  }

  if (access.sellerAcceptedAt) {
    return { stage: investorCopy.stageMatched, open: true };
  }

  return { stage: investorCopy.stageWaiting, open: true };
}

export async function loadInvestorDesk(
  userId: string,
  email: string,
): Promise<InvestorDesk> {
  const [accesses, favorites, questions, meetings, hired, draft] =
    await Promise.all([
      prisma.projectAccess.findMany({
        where: {
          investorId: userId,
          cancelledAt: null,
          project: { status: "published" },
        },
        select: {
          id: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
          loiAcceptedAt: true,
          investorReadAt: true,
          project: {
            select: {
              id: true,
              slug: true,
              codename: true,
              region: true,
              askingPriceCents: true,
              successFee: {
                select: {
                  id: true,
                  closedPriceCents: true,
                  buyerNetCents: true,
                  buyerVatCents: true,
                  recordedAt: true,
                },
              },
              owner: { select: { name: true, lastName: true } },
              dataRoomGrants: {
                where: { investorId: userId },
                select: { id: true },
              },
              messages: {
                where: { investorId: userId },
                select: {
                  id: true,
                  author: true,
                  kind: true,
                  body: true,
                  advisorId: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      }),
      prisma.projectFavorite.count({ where: { investorId: userId } }),
      prisma.projectMessage.count({
        where: { investorId: userId, author: "investor", kind: "question" },
      }),
      prisma.projectMessage.count({
        where: { investorId: userId, kind: "meeting" },
      }),
      prisma.advisoryEngagement.findMany({
        where: {
          requesterId: userId,
          advisorId: { not: null },
          depositPaidAt: { not: null },
          declinedAt: null,
        },
        select: { projectId: true },
      }),
      loadInvestorDraft(userId, email),
    ]);
  const hiredProjects = new Set(hired.map((row) => row.projectId));
  const sharedIds = accesses
    .filter(
      (access) =>
        access.ndaAcceptedAt !== null &&
        access.project.dataRoomGrants.length > 0,
    )
    .map((access) => access.project.id);
  // One round of independent lookups: each extra await is a full round trip to the database.
  const [sharedFiles, shareRows, contracts] = await Promise.all([
    sharedIds.length === 0
      ? Promise.resolve([])
      : prisma.dataRoomFile.findMany({
          where: { projectId: { in: sharedIds } },
          select: { id: true, projectId: true, folder: true, fileName: true },
          orderBy: { createdAt: "asc" },
        }),
    sharedIds.length === 0
      ? Promise.resolve([])
      : prisma.dataRoomFileShare.findMany({
          where: { investorId: userId, file: { projectId: { in: sharedIds } } },
          select: { fileId: true, investorId: true },
        }),
    contractViews(
      accesses.map((access) => ({
        accessId: access.id,
        party: "buyer" as const,
        open: contractStageOpen({
          loiAccepted: access.loiAcceptedAt !== null,
        }),
      })),
    ),
  ]);
  const processes = accesses.map((access) => {
    const stage = stageFor(access);
    const granted = access.project.dataRoomGrants.length > 0;
    const projectFiles = sharedFiles.filter(
      (file) => file.projectId === access.project.id,
    );
    const visible = sharedFileIds({
      files: projectFiles,
      investorId: userId,
      granted,
      shares: shareRows,
    });
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
      accessId: access.id,
      slug: access.project.slug,
      codename: access.project.codename,
      region: access.project.region,
      askingPrice: formatWholeEur(access.project.askingPriceCents),
      stage: stage.stage,
      open: stage.open,
      nda: access.ndaAcceptedAt !== null,
      sellerAccepted: access.sellerAcceptedAt !== null,
      steps: dealPipeline(
        "investor",
        processFlags({
          accepted: access.sellerAcceptedAt !== null,
          nda: access.ndaAcceptedAt !== null,
          questions: access.project.messages.some(
            (message) => message.kind === "question",
          ),
          meeting: access.project.messages.some(
            (message) => message.kind === "meeting",
          ),
          offer: access.project.messages.some(
            (message) => message.kind === "offer",
          ),
          loiAccepted: access.loiAcceptedAt !== null,
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
          advisorId: message.advisorId,
        }),
      ),
      documents,
      documentsNote,
      partyName: access.project.owner
        ? personName(
            access.project.owner.name,
            access.project.owner.lastName,
          ) || companyCopy.companyParty
        : companyCopy.companyParty,
      advisorHired: hiredProjects.has(access.project.id),
      contract: null as ContractView | null,
      lastReadAt: access.investorReadAt?.toISOString() ?? null,
      closed: null as BuyerClosed | null,
    };
  });
  for (const card of processes) {
    card.contract = contracts.get(card.accessId) ?? null;
    card.steps = withContractAccepted(
      card.steps,
      card.contract?.stage === "signing",
    );
    const fee =
      accesses.find((access) => access.id === card.accessId)?.project
        .successFee ?? null;
    card.closed = buyerClosed(fee, card.contract?.stage === "signed");
  }

  return {
    pending: processes.filter(
      (process) => process.open && process.closed === null,
    ),
    processes,
    favorites,
    interests: accesses.length,
    questions,
    meetings,
    profileChecks: investorProfileChecks(draft),
  };
}

export type CancelledProcess = {
  accessId: string;
  slug: string;
  codename: string;
  cancelledAt: string;
};

/** Processes the buyer (or seller) closed; kept reachable from the summary so nothing silently disappears. */
export async function listCancelledProcesses(
  userId: string,
): Promise<CancelledProcess[]> {
  const rows = await prisma.projectAccess.findMany({
    where: { investorId: userId, cancelledAt: { not: null } },
    select: {
      id: true,
      cancelledAt: true,
      project: { select: { slug: true, codename: true } },
    },
    orderBy: { cancelledAt: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    accessId: row.id,
    slug: row.project.slug,
    codename: row.project.codename,
    cancelledAt: (row.cancelledAt ?? new Date()).toISOString(),
  }));
}
