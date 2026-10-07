import { randomUUID } from "node:crypto";
import { advisorIsListed } from "@/lib/advisor-directory";
import { advisoryServices } from "@/lib/advisory";
import { advisorNdaAgreement, spanishDate } from "@/lib/deal-documents";
import { engagementCopy } from "@/lib/engagement-copy";
import {
  advisorCompanyView,
  advisorNdaOutcome,
  canOpenSellerGrant,
  claimEngagementOutcome,
  requestEngagementOutcome,
  type EngagementClientName,
} from "@/lib/engagement";
import { advisorPlatformFee } from "@/lib/billing";
import { folderNameSchema } from "@/lib/data-room";
import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import { formatEur } from "@/lib/money";
import { publicProjectSelect } from "@/lib/public-project";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { investorVisibleFiles, type VisibleFile } from "@/server/investorVisibleFiles";
import { recordNotification } from "@/server/recordNotification";

export type EngagementResult = { ok: true; message?: string } | { ok: false; message: string };

export type EngagementCard = {
  id: string;
  codename: string;
  region: string;
  clientLabel: string;
  services: string;
};

export type AdvisorWork = {
  paid: boolean;
  mine: EngagementCard[];
  inbox: EngagementCard[];
};

export type SellerAdvisorAccess = {
  waiting: boolean;
  ready: {
    engagementId: string;
    advisorName: string;
    folders: string[];
    processOpened: boolean;
  }[];
};

export type AdvisorEngagementPage = {
  id: string;
  codename: string;
  region: string;
  figures: { label: string; value: string }[];
  clientLabel: string;
  services: string;
  view: "public" | "investor" | "seller";
  profile: InvestorProjectProfile | null;
  documents: VisibleFile[];
  folders: { name: string; files: VisibleFile[] }[];
  processOpened: boolean;
  ndaText: string | null;
  closed: boolean;
  feeLabel: string | null;
};

function serviceLabel(ids: string[]): string {
  return ids
    .map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id)
    .join(", ");
}

function clientLabel(client: EngagementClientName): string {
  return client === "investor" ? engagementCopy.fromInvestor : engagementCopy.fromSeller;
}

function toCard(row: {
  id: string;
  client: EngagementClientName;
  services: string[];
  project: { codename: string; region: string };
}): EngagementCard {
  return {
    id: row.id,
    codename: row.project.codename,
    region: row.project.region,
    clientLabel: clientLabel(row.client),
    services: serviceLabel(row.services),
  };
}

async function inboxPaid(userId: string): Promise<boolean> {
  const row = await prisma.billingCustomer.findUnique({
    where: { userId },
    select: { advisorInbox: true },
  });

  return row?.advisorInbox === true;
}

export async function advisorIsPublic(userId: string): Promise<boolean> {
  const profile = await prisma.advisorProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      nif: true,
      postalCode: true,
      description: true,
      sectors: true,
      services: true,
    },
  });

  return profile !== null && advisorIsListed(profile);
}

export async function createEngagement(input: {
  projectId: string;
  requesterId: string;
  client: EngagementClientName;
  services: string[];
  advisorId: string | null;
  codename: string;
}): Promise<void> {
  const id = randomUUID();

  await prisma.advisoryEngagement.create({
    data: {
      id,
      projectId: input.projectId,
      requesterId: input.requesterId,
      client: input.client,
      services: input.services,
      advisorId: input.advisorId,
    },
  });

  if (input.advisorId) {
    await recordNotification({
      userId: input.advisorId,
      title: "Nuevo encargo",
      body: `${clientLabel(input.client)} ha pedido asesoramiento para ${input.codename}.`,
      href: `/mandatos/encargos/${id}`,
    });
  }
}

export async function engagementProject(input: {
  slug: string;
  user: CurrentUser;
}): Promise<{ ok: true; projectId: string; codename: string; client: EngagementClientName } | { ok: false; message: string }> {
  const project = await prisma.project.findUnique({
    where: { slug: input.slug },
    select: { id: true, codename: true, status: true, ownerId: true },
  });
  const outcome = requestEngagementOutcome({
    onboarded: input.user.onboarded,
    role: input.user.role,
    projectExists: project !== null,
    sellerOwns: project?.ownerId === input.user.id,
    published: project?.status === "published",
  });

  if (!outcome.ok || !project) {
    return { ok: false, message: engagementCopy.projectMissing };
  }

  return { ok: true, projectId: project.id, codename: project.codename, client: outcome.client };
}

export async function listAdvisorWork(userId: string): Promise<AdvisorWork> {
  const paid = await inboxPaid(userId);
  const mine = await prisma.advisoryEngagement.findMany({
    where: { advisorId: userId },
    select: {
      id: true,
      client: true,
      services: true,
      project: { select: { codename: true, region: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const inbox = paid
    ? await prisma.advisoryEngagement.findMany({
        where: { advisorId: null },
        select: {
          id: true,
          client: true,
          services: true,
          project: { select: { codename: true, region: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    paid,
    mine: mine.map(toCard),
    inbox: inbox.map(toCard),
  };
}

export async function claimEngagement(user: CurrentUser, id: string): Promise<EngagementResult> {
  const row = await prisma.advisoryEngagement.findUnique({
    where: { id },
    select: { id: true, advisorId: true },
  });
  const outcome = claimEngagementOutcome({
    isAdvisor: user.onboarded && user.role === "advisor",
    paid: await inboxPaid(user.id),
    exists: row !== null,
    ownerId: row?.advisorId ?? null,
  });

  if (!outcome.ok) {
    const message =
      outcome.code === "taken"
        ? engagementCopy.taken
        : outcome.code === "plan"
          ? engagementCopy.planRequired
          : outcome.code === "missing"
            ? engagementCopy.missing
            : engagementCopy.planRequired;
    return { ok: false, message };
  }

  const updated = await prisma.advisoryEngagement.updateMany({
    where: { id, advisorId: null },
    data: { advisorId: user.id, claimedAt: new Date() },
  });

  if (updated.count === 0) {
    return { ok: false, message: engagementCopy.taken };
  }

  return { ok: true, message: engagementCopy.claimed };
}

export async function getAdvisorEngagement(user: CurrentUser, id: string): Promise<AdvisorEngagementPage | null> {
  if (!user.onboarded || user.role !== "advisor") {
    return null;
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id },
    select: {
      id: true,
      client: true,
      services: true,
      advisorNdaAcceptedAt: true,
      processOpened: true,
      closedAt: true,
      platformNetCents: true,
      platformVatCents: true,
      requesterId: true,
      project: { select: { id: true, ...publicProjectSelect } },
      folders: { select: { folder: true } },
    },
  });

  if (!row) {
    return null;
  }

  const access =
    row.client === "investor"
      ? await prisma.projectAccess.findUnique({
          where: { projectId_investorId: { projectId: row.project.id, investorId: row.requesterId } },
          select: { ndaAcceptedAt: true },
        })
      : null;
  const view = advisorCompanyView({
    hiredByInvestor: row.client === "investor",
    advisorSigned: row.advisorNdaAcceptedAt !== null,
    investorSigned: access?.ndaAcceptedAt !== null && access?.ndaAcceptedAt !== undefined,
  });
  const profile =
    view === "investor"
      ? await prisma.project.findUnique({
          where: { id: row.project.id },
          select: investorProjectSelect,
        })
      : null;
  const documents = view === "investor" ? await investorVisibleFiles(row.requesterId, row.project.id) : [];
  const opened = row.folders.map((folder) => folder.folder);
  const sellerFiles =
    view === "seller" && opened.length > 0
      ? await prisma.dataRoomFile.findMany({
          where: { projectId: row.project.id, folder: { in: opened } },
          select: { id: true, folder: true, fileName: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const folders = opened.map((name) => ({
    name,
    files: sellerFiles.filter((file) => file.folder === name),
  }));

  return {
    id: row.id,
    codename: row.project.codename,
    region: row.project.region,
    figures: [
      { label: "Facturación", value: formatEur(row.project.revenueCents) },
      { label: "EBITDA", value: formatEur(row.project.ebitdaCents) },
      { label: "EBITDA ajustado", value: formatEur(row.project.adjustedEbitdaCents) },
      { label: "Precio", value: formatEur(row.project.askingPriceCents) },
    ],
    clientLabel: clientLabel(row.client),
    services: serviceLabel(row.services),
    view,
    profile: profile ? toInvestorProject(profile) : null,
    documents,
    folders,
    processOpened: view === "seller" && row.processOpened,
    ndaText:
      row.client === "investor" && row.advisorNdaAcceptedAt === null
        ? advisorNdaAgreement({
            advisorName: user.displayName,
            codename: row.project.codename,
            region: row.project.region,
            dateLabel: spanishDate(new Date()),
          })
        : null,
    closed: row.closedAt !== null,
    feeLabel:
      row.platformNetCents !== null && row.platformVatCents !== null
        ? `${formatEur(row.platformNetCents)} + ${formatEur(row.platformVatCents)} IVA`
        : null,
  };
}

export async function acceptAdvisorNda(user: CurrentUser, id: string): Promise<EngagementResult> {
  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id },
    select: { id: true, client: true, advisorNdaAcceptedAt: true },
  });
  const outcome = advisorNdaOutcome({
    isAdvisor: user.onboarded && user.role === "advisor",
    hiredByInvestor: row?.client === "investor",
    ownsEngagement: row !== null,
    alreadySigned: row?.advisorNdaAcceptedAt !== null && row?.advisorNdaAcceptedAt !== undefined,
  });

  if (!outcome.ok || !row) {
    return { ok: false, message: outcome.ok ? engagementCopy.missing : engagementCopy.missing };
  }

  if (outcome.stamp) {
    await prisma.advisoryEngagement.update({
      where: { id: row.id },
      data: { advisorNdaAcceptedAt: new Date() },
    });
  }

  return { ok: true, message: engagementCopy.ndaSigned };
}

export async function closeEngagement(user: CurrentUser, id: string, chargedCents: number): Promise<EngagementResult> {
  if (!user.onboarded || user.role !== "advisor") {
    return { ok: false, message: engagementCopy.missing };
  }

  const fee = advisorPlatformFee(chargedCents);

  if (!fee) {
    return { ok: false, message: engagementCopy.feeInvalid };
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id },
    select: { id: true, closedAt: true },
  });

  if (!row) {
    return { ok: false, message: engagementCopy.missing };
  }

  if (row.closedAt === null) {
    await prisma.advisoryEngagement.update({
      where: { id: row.id },
      data: {
        closedAt: new Date(),
        chargedCents,
        platformNetCents: fee.netCents,
        platformVatCents: fee.vatCents,
      },
    });
  }

  return { ok: true, message: engagementCopy.feeStored };
}

async function sellerGrant(user: CurrentUser, id: string): Promise<{ id: string; projectId: string } | null> {
  const row = await prisma.advisoryEngagement.findUnique({
    where: { id },
    select: {
      id: true,
      client: true,
      advisorId: true,
      project: { select: { id: true, ownerId: true } },
    },
  });

  if (!row) {
    return null;
  }

  const allowed = canOpenSellerGrant({
    isSeller: user.onboarded && user.role === "seller",
    ownsProject: row.project.ownerId === user.id,
    hiredBySeller: row.client === "seller",
    advisorAssigned: row.advisorId !== null,
  });

  return allowed ? { id: row.id, projectId: row.project.id } : null;
}

export async function setAdvisorFolder(user: CurrentUser, id: string, folder: string, open: boolean): Promise<EngagementResult> {
  const parsed = folderNameSchema.safeParse(folder);
  const grant = await sellerGrant(user, id);

  if (!parsed.success || !grant) {
    return { ok: false, message: engagementCopy.missing };
  }

  if (open) {
    await prisma.advisorFolderOpen.upsert({
      where: { engagementId_folder: { engagementId: grant.id, folder: parsed.data } },
      create: { id: randomUUID(), engagementId: grant.id, folder: parsed.data },
      update: {},
    });
  } else {
    await prisma.advisorFolderOpen.deleteMany({
      where: { engagementId: grant.id, folder: parsed.data },
    });
  }

  return { ok: true };
}

export async function setAdvisorProcess(user: CurrentUser, id: string, open: boolean): Promise<EngagementResult> {
  const grant = await sellerGrant(user, id);

  if (!grant) {
    return { ok: false, message: engagementCopy.missing };
  }

  await prisma.advisoryEngagement.update({
    where: { id: grant.id },
    data: { processOpened: open },
  });

  return { ok: true };
}

export async function sellerAdvisorAccess(userId: string, projectId: string | null): Promise<SellerAdvisorAccess> {
  if (!projectId) {
    return { waiting: false, ready: [] };
  }

  const rows = await prisma.advisoryEngagement.findMany({
    where: { projectId, requesterId: userId, client: "seller" },
    select: {
      id: true,
      advisorId: true,
      processOpened: true,
      folders: { select: { folder: true } },
      advisor: { select: { advisorProfile: { select: { businessName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    waiting: rows.some((row) => row.advisorId === null),
    ready: rows.flatMap((row) => {
      if (!row.advisorId) {
        return [];
      }

      const name = row.advisor?.advisorProfile?.businessName.trim() ?? "";

      return [
        {
          engagementId: row.id,
          advisorName: name === "" ? "Asesor" : name,
          folders: row.folders.map((folder) => folder.folder),
          processOpened: row.processOpened,
        },
      ];
    }),
  };
}

export async function advisorMayReadFile(advisorId: string, fileId: string): Promise<boolean> {
  const file = await prisma.dataRoomFile.findUnique({
    where: { id: fileId },
    select: { id: true, folder: true, projectId: true },
  });

  if (!file) {
    return false;
  }

  const rows = await prisma.advisoryEngagement.findMany({
    where: { advisorId, projectId: file.projectId },
    select: {
      client: true,
      requesterId: true,
      advisorNdaAcceptedAt: true,
      folders: { select: { folder: true } },
    },
  });

  for (const row of rows) {
    if (row.client === "seller" && row.folders.some((folder) => folder.folder === file.folder)) {
      return true;
    }

    if (row.client === "investor" && row.advisorNdaAcceptedAt !== null) {
      const visible = await investorVisibleFiles(row.requesterId, file.projectId);

      if (visible.some((item) => item.id === file.id)) {
        return true;
      }
    }
  }

  return false;
}
