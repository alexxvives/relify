import { randomUUID } from "node:crypto";
import { advisorIsListed } from "@/lib/advisor-directory";
import { advisorInterestBody, advisoryServices } from "@/lib/advisory";
import { advisorNdaAgreement, spanishDate } from "@/lib/deal-documents";
import type { DealStep } from "@/lib/deal-pipeline";
import { engagementCopy } from "@/lib/engagement-copy";
import {
  advisorCompanyView,
  advisorEngagementStep,
  advisorHomeDesk,
  advisorNdaOutcome,
  canOpenSellerGrant,
  claimEngagementOutcome,
  declineEngagementOutcome,
  requestEngagementOutcome,
  type AdvisorHomeDesk,
  type AdvisorStep,
  type EngagementClientName,
} from "@/lib/engagement";
import {
  advisorProjectBoards,
  splitAdvisorEngagements,
  type AdvisorEngagementSnapshot,
  type AdvisorProjectBoard,
} from "@/lib/advisor-processes";
import { advisorDepositCents, advisorPlatformFee } from "@/lib/billing";
import { folderNameSchema, visibleFolderNames } from "@/lib/data-room";
import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import { figureVeilCents } from "@/lib/figure-veil";
import { formatEur, formatWholeEur } from "@/lib/money";
import { personName } from "@/lib/project-message";
import { publicProjectSelect } from "@/lib/public-project";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { publicCardsByInvestor } from "@/server/investorProfile";
import { investorVisibleFiles, type VisibleFile } from "@/server/investorVisibleFiles";
import { projectCoverHref, projectCoverIsStored, projectCoverVersion } from "@/server/projectCover";
import { recordNotification } from "@/server/recordNotification";

export type EngagementResult = { ok: true; message?: string } | { ok: false; message: string };

export type EngagementCard = {
  id: string;
  codename: string;
  region: string;
  clientLabel: string;
  services: string;
  step: AdvisorStep;
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
    fileIds: string[];
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
  deposit: { paid: boolean; amountLabel: string };
  hiredByInvestor: boolean;
  figuresOpen: boolean;
  description: string;
  showcase: {
    slug: string;
    coverSrc: string | null;
    locked: boolean;
    revenue: string;
    ebitda: string;
    adjustedEbitda: string;
    askingPrice: string;
    askingPriceCents: number | null;
    ebitdaCents: number | null;
  };
  investorCard: PublicInvestorCard | null;
  steps: DealStep[];
  preview: {
    description: string;
    facts: { label: string; value: string }[];
    investor: { label: string; value: string }[];
    showInvestor: boolean;
  } | null;
};

function serviceLabel(ids: string[]): string {
  return ids
    .map((id) => advisoryServices.find((service) => service.id === id)?.title ?? id)
    .join(", ");
}

function clientLabel(client: EngagementClientName): string {
  return client === "investor" ? engagementCopy.fromInvestor : engagementCopy.fromSeller;
}

function investorPartyName(person: { name: string; lastName: string | null }): string {
  const named = personName(person.name, person.lastName);
  return named.length > 0 ? named : engagementCopy.fromInvestor;
}

function toCard(
  row: {
    id: string;
    client: EngagementClientName;
    services: string[];
    project: { codename: string; region: string };
    closedAt?: Date | null;
    depositPaidAt?: Date | null;
    advisorNdaAcceptedAt?: Date | null;
  },
  owned: boolean,
  partyName?: string,
): EngagementCard {
  return {
    id: row.id,
    codename: row.project.codename,
    region: row.project.region,
    clientLabel: partyName && partyName.length > 0 ? partyName : clientLabel(row.client),
    services: serviceLabel(row.services),
    step: advisorEngagementStep({
      owned,
      closed: row.closedAt !== null && row.closedAt !== undefined,
      depositPaid: row.depositPaidAt !== null && row.depositPaidAt !== undefined,
      hiredByInvestor: row.client === "investor",
      ndaSigned: row.advisorNdaAcceptedAt !== null && row.advisorNdaAcceptedAt !== undefined,
    }),
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
    const titles = input.services.map((serviceId) => advisoryServices.find((service) => service.id === serviceId)?.title ?? serviceId);

    await prisma.engagementMessage.create({
      data: {
        id: randomUUID(),
        engagementId: id,
        author: "client",
        kind: "question",
        body: advisorInterestBody(titles),
      },
    });
    await recordNotification({
      userId: input.advisorId,
      title: "Nuevo encargo",
      body: `${clientLabel(input.client)} ha pedido asesoramiento para ${input.codename}.`,
      href: `/mandatos/encargos/${id}`,
    });
  }
}

export async function deleteClientEngagement(user: CurrentUser, engagementId: string): Promise<EngagementResult> {
  if (!user.onboarded || (user.role !== "investor" && user.role !== "seller")) {
    return { ok: false, message: engagementCopy.missing };
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id: engagementId, requesterId: user.id },
    select: { id: true },
  });

  if (!row) {
    return { ok: false, message: engagementCopy.missing };
  }

  await prisma.advisoryEngagement.delete({ where: { id: row.id } });
  return { ok: true };
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
    where: { advisorId: userId, declinedAt: null },
    select: {
      id: true,
      client: true,
      services: true,
      closedAt: true,
      depositPaidAt: true,
      advisorNdaAcceptedAt: true,
      requester: { select: { name: true, lastName: true } },
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
    mine: mine.map((row) =>
      toCard(row, true, row.client === "investor" ? investorPartyName(row.requester) : engagementCopy.fromSeller),
    ),
    inbox: inbox.map((row) => toCard(row, false)),
  };
}

export async function getAdvisorDesk(userId: string): Promise<AdvisorHomeDesk> {
  const [mine, inboxCount] = await Promise.all([
    prisma.advisoryEngagement.findMany({
      where: { advisorId: userId, declinedAt: null },
      select: {
        id: true,
        client: true,
        closedAt: true,
        depositPaidAt: true,
        advisorNdaAcceptedAt: true,
        project: { select: { codename: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.advisoryEngagement.count({ where: { advisorId: null } }),
  ]);

  return advisorHomeDesk({
    inboxCount,
    mine: mine.map((row) => ({
      id: row.id,
      codename: row.project.codename,
      step: advisorEngagementStep({
        owned: true,
        closed: row.closedAt !== null,
        depositPaid: row.depositPaidAt !== null,
        hiredByInvestor: row.client === "investor",
        ndaSigned: row.advisorNdaAcceptedAt !== null,
      }),
    })),
  });
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

function showcaseFor(
  project: {
    id: string;
    slug: string;
    revenueCents: number;
    ebitdaCents: number;
    adjustedEbitdaCents: number;
    askingPriceCents: number;
  },
  locked: boolean,
): AdvisorEngagementPage["showcase"] {
  const version = projectCoverIsStored(project.id) ? projectCoverVersion(project.id) : null;
  const coverSrc = version ? projectCoverHref(project.slug, version) : null;

  if (locked) {
    const veil = formatWholeEur(figureVeilCents);

    return {
      slug: project.slug,
      coverSrc,
      locked: true,
      revenue: veil,
      ebitda: veil,
      adjustedEbitda: veil,
      askingPrice: veil,
      askingPriceCents: null,
      ebitdaCents: null,
    };
  }

  return {
    slug: project.slug,
    coverSrc,
    locked: false,
    revenue: formatWholeEur(project.revenueCents),
    ebitda: formatWholeEur(project.ebitdaCents),
    adjustedEbitda: formatWholeEur(project.adjustedEbitdaCents),
    askingPrice: formatWholeEur(project.askingPriceCents),
    askingPriceCents: project.askingPriceCents,
    ebitdaCents: project.ebitdaCents,
  };
}

async function investorCardFor(
  client: EngagementClientName,
  requester: { id: string; email: string },
): Promise<PublicInvestorCard | null> {
  if (client !== "investor") {
    return null;
  }

  const cards = await publicCardsByInvestor([requester]);
  return cards.get(requester.id) ?? null;
}

async function bannerStepsFor(row: {
  id: string;
  client: EngagementClientName;
  requesterId: string;
  services: string[];
  depositPaidAt: Date | null;
  advisorNdaAcceptedAt: Date | null;
  processOpened: boolean;
  closedAt: Date | null;
  project: { id: string; slug: string; codename: string; region: string };
}): Promise<DealStep[]> {
  const project = await prisma.project.findUnique({
    where: { id: row.project.id },
    select: {
      successFee: { select: { id: true } },
      accesses: {
        select: {
          investorId: true,
          requestedAt: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
          loiAcceptedAt: true,
          diligencePassedAt: true,
        },
      },
    },
  });

  if (!project) {
    return [];
  }

  const [messages, grants] = await Promise.all([
    prisma.projectMessage.findMany({
      where: { projectId: row.project.id },
      select: { investorId: true, kind: true },
    }),
    prisma.dataRoomGrant.findMany({
      where: { projectId: row.project.id },
      select: { investorId: true },
    }),
  ]);
  const grantKeys = new Set(grants.map((grant) => grant.investorId));
  const [board] = advisorProjectBoards([
    {
      id: row.id,
      client: row.client,
      requesterId: row.requesterId,
      services: serviceLabel(row.services),
      depositPaid: row.depositPaidAt !== null,
      advisorNda: row.advisorNdaAcceptedAt !== null,
      processOpened: row.processOpened,
      closed: row.closedAt !== null,
      projectId: row.project.id,
      slug: row.project.slug,
      codename: row.project.codename,
      region: row.project.region,
      saleClosed: project.successFee !== null,
      accesses: project.accesses.map((access) => {
        const thread = messages.filter((message) => message.investorId === access.investorId);

        return {
          investorId: access.investorId,
          requestedAt: access.requestedAt,
          accepted: access.sellerAcceptedAt !== null,
          nda: access.ndaAcceptedAt !== null,
          questions: thread.some((message) => message.kind === "question"),
          meeting: thread.some((message) => message.kind === "meeting"),
          offer: thread.some((message) => message.kind === "offer"),
          loiAccepted: access.loiAcceptedAt !== null,
          roomShared: grantKeys.has(access.investorId),
          passedDiligence: access.diligencePassedAt !== null,
        };
      }),
    },
  ]);

  return board?.lanes[0]?.steps ?? [];
}

export async function getAdvisorEngagement(user: CurrentUser, id: string): Promise<AdvisorEngagementPage | null> {
  if (!user.onboarded || user.role !== "advisor") {
    return null;
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id, declinedAt: null },
    select: {
      id: true,
      client: true,
      services: true,
      advisorNdaAcceptedAt: true,
      processOpened: true,
      closedAt: true,
      platformNetCents: true,
      platformVatCents: true,
      depositPaidAt: true,
      requesterId: true,
      requester: { select: { id: true, email: true, name: true, lastName: true } },
      project: {
        select: {
          id: true,
          ...publicProjectSelect,
          description: true,
          foundedYear: true,
          headcountRange: true,
          cnaes: { select: { code: true }, orderBy: { position: "asc" }, take: 1 },
        },
      },
      folders: { select: { folder: true } },
      fileShares: { select: { file: { select: { id: true, folder: true, fileName: true } } } },
    },
  });

  if (!row) {
    return null;
  }

  const depositAmount = formatEur(advisorDepositCents(row.project.askingPriceCents));
  const companyRow = await prisma.project.findUnique({
    where: { id: row.project.id },
    select: investorProjectSelect,
  });
  const company = companyRow ? toInvestorProject(companyRow) : null;
  const namedClient = row.client === "investor" ? investorPartyName(row.requester) : engagementCopy.fromSeller;
  const investorCard = await investorCardFor(row.client, row.requester);
  const steps = await bannerStepsFor(row);

  if (row.depositPaidAt === null) {
    return {
      id: row.id,
      codename: row.project.codename,
      region: row.project.region,
      figures: [],
      clientLabel: namedClient,
      services: serviceLabel(row.services),
      view: "public",
      profile: company,
      documents: [],
      folders: [],
      processOpened: false,
      ndaText: null,
      closed: row.closedAt !== null,
      feeLabel: null,
      deposit: { paid: false, amountLabel: depositAmount },
      hiredByInvestor: row.client === "investor",
      figuresOpen: false,
      description: row.project.description?.trim() ?? "",
      showcase: showcaseFor(row.project, true),
      investorCard,
      steps,
      preview: null,
    };
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
  const documents = view === "investor" ? await investorVisibleFiles(row.requesterId, row.project.id) : [];
  const opened = row.folders.map((folder) => folder.folder);
  const sharedFiles = view === "seller" ? row.fileShares.map((share) => share.file) : [];
  const sellerFiles =
    view === "seller" && opened.length > 0
      ? await prisma.dataRoomFile.findMany({
          where: { projectId: row.project.id, folder: { in: opened } },
          select: { id: true, folder: true, fileName: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const visibleFiles = [...sellerFiles];
  for (const file of sharedFiles) {
    if (!visibleFiles.some((item) => item.id === file.id)) {
      visibleFiles.push(file);
    }
  }
  const folderNames = [...opened];
  for (const file of visibleFiles) {
    if (!folderNames.includes(file.folder)) {
      folderNames.push(file.folder);
    }
  }
  const folders = folderNames.map((name) => ({
    name,
    files: visibleFiles.filter((file) => file.folder === name),
  }));

  const figuresOpen = view === "investor";

  return {
    id: row.id,
    codename: row.project.codename,
    region: row.project.region,
    figures: figuresOpen
      ? [
          { label: "Facturación", value: formatEur(row.project.revenueCents) },
          { label: "EBITDA", value: formatEur(row.project.ebitdaCents) },
          { label: "EBITDA ajustado", value: formatEur(row.project.adjustedEbitdaCents) },
          { label: "Precio", value: formatEur(row.project.askingPriceCents) },
        ]
      : [],
    clientLabel: namedClient,
    services: serviceLabel(row.services),
    view,
    profile: company,
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
    deposit: { paid: true, amountLabel: depositAmount },
    hiredByInvestor: row.client === "investor",
    figuresOpen,
    description: row.project.description?.trim() ?? "",
    showcase: showcaseFor(row.project, !figuresOpen),
    investorCard,
    steps,
    preview: null,
  };
}

export async function declineEngagement(user: CurrentUser, id: string): Promise<EngagementResult> {
  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id, declinedAt: null },
    select: {
      id: true,
      depositPaidAt: true,
      requesterId: true,
      client: true,
      project: { select: { codename: true } },
    },
  });
  const outcome = declineEngagementOutcome({
    isAdvisor: user.onboarded && user.role === "advisor",
    owns: row !== null,
    depositPaid: row?.depositPaidAt !== null && row?.depositPaidAt !== undefined,
  });

  if (!outcome.ok || !row) {
    return {
      ok: false,
      message: !outcome.ok && outcome.code === "paid" ? engagementCopy.declinePaid : engagementCopy.missing,
    };
  }

  await prisma.advisoryEngagement.update({
    where: { id: row.id },
    data: { declinedAt: new Date() },
  });
  await recordNotification({
    userId: row.requesterId,
    title: engagementCopy.declinedTitle,
    body: `${engagementCopy.declinedBody} ${row.project.codename}.`,
    href: row.client === "seller" ? "/mi-empresa/servicios" : "/asesoramiento",
  });

  return { ok: true };
}

export async function acceptAdvisorNda(user: CurrentUser, id: string): Promise<EngagementResult> {
  const row = await prisma.advisoryEngagement.findFirst({
    where: { id, advisorId: user.id, declinedAt: null },
    select: { id: true, client: true, advisorNdaAcceptedAt: true, depositPaidAt: true },
  });
  const outcome = advisorNdaOutcome({
    isAdvisor: user.onboarded && user.role === "advisor",
    hiredByInvestor: row?.client === "investor",
    ownsEngagement: row !== null,
    alreadySigned: row?.advisorNdaAcceptedAt !== null && row?.advisorNdaAcceptedAt !== undefined,
    depositPaid: row?.depositPaidAt !== null && row?.depositPaidAt !== undefined,
  });

  if (!outcome.ok || !row) {
    return { ok: false, message: outcome.ok ? engagementCopy.missing : outcome.code === "deposit" ? engagementCopy.depositRequired : engagementCopy.missing };
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
    where: { id, advisorId: user.id, declinedAt: null },
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
      declinedAt: true,
      project: { select: { id: true, ownerId: true } },
    },
  });

  if (!row || row.declinedAt) {
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

export async function shareAdvisorDocuments(
  user: CurrentUser,
  input: { engagementId: string; scope: "file" | "folder" | "room"; fileId: string; folder: string; shared: boolean },
): Promise<EngagementResult> {
  const grant = await sellerGrant(user, input.engagementId);

  if (!grant) {
    return { ok: false, message: engagementCopy.missing };
  }

  if (input.scope === "file") {
    return shareOneAdvisorFile(grant.id, grant.projectId, input.fileId, input.shared);
  }

  const names = await projectFolderNames(grant.projectId);
  const targets = input.scope === "folder" ? names.filter((name) => name === input.folder) : names;

  if (input.scope === "folder" && targets.length === 0) {
    return { ok: false, message: engagementCopy.missing };
  }

  for (const folder of targets) {
    const result = await setAdvisorFolder(user, grant.id, folder, input.shared);
    if (!result.ok) {
      return result;
    }
  }

  if (!input.shared && input.scope === "room") {
    await prisma.advisorFileShare.deleteMany({ where: { engagementId: grant.id } });
  }

  if (!input.shared && input.scope === "folder") {
    await prisma.advisorFileShare.deleteMany({
      where: { engagementId: grant.id, file: { folder: input.folder, projectId: grant.projectId } },
    });
  }

  return { ok: true };
}

async function shareOneAdvisorFile(engagementId: string, projectId: string, fileId: string, shared: boolean): Promise<EngagementResult> {
  const file = await prisma.dataRoomFile.findFirst({
    where: { id: fileId, projectId },
    select: { id: true, folder: true },
  });

  if (!file) {
    return { ok: false, message: engagementCopy.missing };
  }

  const open = await prisma.advisorFolderOpen.findUnique({
    where: { engagementId_folder: { engagementId, folder: file.folder } },
    select: { id: true },
  });

  if (shared) {
    if (!open) {
      await prisma.advisorFileShare.upsert({
        where: { engagementId_fileId: { engagementId, fileId: file.id } },
        create: { id: randomUUID(), engagementId, fileId: file.id },
        update: {},
      });
    }
    return { ok: true };
  }

  await prisma.advisorFileShare.deleteMany({ where: { engagementId, fileId: file.id } });

  if (open) {
    await prisma.advisorFolderOpen.delete({ where: { id: open.id } });
    const siblings = await prisma.dataRoomFile.findMany({
      where: { projectId, folder: file.folder, id: { not: file.id } },
      select: { id: true },
    });
    for (const sibling of siblings) {
      await prisma.advisorFileShare.upsert({
        where: { engagementId_fileId: { engagementId, fileId: sibling.id } },
        create: { id: randomUUID(), engagementId, fileId: sibling.id },
        update: {},
      });
    }
  }

  return { ok: true };
}

async function projectFolderNames(projectId: string): Promise<string[]> {
  const [files, folderRows] = await Promise.all([
    prisma.dataRoomFile.findMany({ where: { projectId }, select: { folder: true } }),
    prisma.dataRoomFolder.findMany({ where: { projectId }, select: { name: true, hidden: true } }),
  ]);

  return visibleFolderNames({ records: folderRows, usedByFiles: files.map((file) => file.folder) });
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
    where: { projectId, requesterId: userId, client: "seller", declinedAt: null },
    select: {
      id: true,
      advisorId: true,
      processOpened: true,
      folders: { select: { folder: true } },
      fileShares: { select: { fileId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    waiting: rows.some((row) => row.advisorId === null),
    ready: rows.flatMap((row) => {
      if (!row.advisorId) {
        return [];
      }

      return [
        {
          engagementId: row.id,
          advisorName: "Asesor",
          folders: row.folders.map((folder) => folder.folder),
          fileIds: row.fileShares.map((share) => share.fileId),
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
    where: { advisorId, projectId: file.projectId, declinedAt: null },
    select: {
      client: true,
      requesterId: true,
      depositPaidAt: true,
      advisorNdaAcceptedAt: true,
      folders: { select: { folder: true } },
      fileShares: { where: { fileId: file.id }, select: { id: true } },
    },
  });

  for (const row of rows) {
    if (row.depositPaidAt === null) {
      continue;
    }

    if (row.client === "seller" && (row.folders.some((folder) => folder.folder === file.folder) || row.fileShares.length > 0)) {
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

function madridDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export type AdvisorPlatformClose = {
  id: string;
  codename: string;
  closedLabel: string;
  services: string;
  clientLabel: string;
};

export async function listAdvisorPlatformCloses(advisorId: string): Promise<AdvisorPlatformClose[]> {
  const rows = await prisma.advisoryEngagement.findMany({
    where: { advisorId, closedAt: { not: null }, declinedAt: null },
    orderBy: { closedAt: "desc" },
    select: {
      id: true,
      closedAt: true,
      client: true,
      services: true,
      project: { select: { codename: true } },
    },
  });

  return rows.flatMap((row) => {
    if (!row.closedAt) {
      return [];
    }

    return [
      {
        id: row.id,
        codename: row.project.codename,
        closedLabel: madridDate(row.closedAt),
        services: serviceLabel(row.services),
        clientLabel: clientLabel(row.client),
      },
    ];
  });
}

export async function listAdvisorProjectBoards(
  advisorId: string,
  scope: "awaiting" | "active",
): Promise<AdvisorProjectBoard[]> {
  const rows = await prisma.advisoryEngagement.findMany({
    where: { advisorId, declinedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      client: true,
      requesterId: true,
      services: true,
      depositPaidAt: true,
      advisorNdaAcceptedAt: true,
      processOpened: true,
      closedAt: true,
      project: {
        select: {
          id: true,
          slug: true,
          codename: true,
          region: true,
          successFee: { select: { id: true } },
          accesses: {
            select: {
              investorId: true,
              requestedAt: true,
              sellerAcceptedAt: true,
              ndaAcceptedAt: true,
              loiAcceptedAt: true,
              diligencePassedAt: true,
            },
          },
        },
      },
    },
  });

  if (rows.length === 0) {
    return [];
  }

  const projectIds = [...new Set(rows.map((row) => row.project.id))];
  const [messages, grants] = await Promise.all([
    prisma.projectMessage.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, investorId: true, kind: true },
    }),
    prisma.dataRoomGrant.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, investorId: true },
    }),
  ]);
  const grantKeys = new Set(grants.map((grant) => `${grant.projectId}:${grant.investorId}`));
  const snapshots: AdvisorEngagementSnapshot[] = rows.map((row) => ({
    id: row.id,
    client: row.client,
    requesterId: row.requesterId,
    services: serviceLabel(row.services),
    depositPaid: row.depositPaidAt !== null,
    advisorNda: row.advisorNdaAcceptedAt !== null,
    processOpened: row.processOpened,
    closed: row.closedAt !== null,
    projectId: row.project.id,
    slug: row.project.slug,
    codename: row.project.codename,
    region: row.project.region,
    saleClosed: row.project.successFee !== null,
    accesses: row.project.accesses.map((access) => {
      const thread = messages.filter(
        (message) => message.projectId === row.project.id && message.investorId === access.investorId,
      );

      return {
        investorId: access.investorId,
        requestedAt: access.requestedAt,
        accepted: access.sellerAcceptedAt !== null,
        nda: access.ndaAcceptedAt !== null,
        questions: thread.some((message) => message.kind === "question"),
        meeting: thread.some((message) => message.kind === "meeting"),
        offer: thread.some((message) => message.kind === "offer"),
        loiAccepted: access.loiAcceptedAt !== null,
        roomShared: grantKeys.has(`${row.project.id}:${access.investorId}`),
        passedDiligence: access.diligencePassedAt !== null,
      };
    }),
  }));

  const split = splitAdvisorEngagements(snapshots);
  return advisorProjectBoards(scope === "awaiting" ? split.awaiting : split.active);
}

export async function verifiedCloseCounts(advisorIds: string[]): Promise<Map<string, number>> {
  if (advisorIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.advisoryEngagement.groupBy({
    by: ["advisorId"],
    where: { advisorId: { in: advisorIds }, closedAt: { not: null }, declinedAt: null },
    _count: { _all: true },
  });

  return new Map(rows.flatMap((row) => (row.advisorId ? [[row.advisorId, row._count._all] as const] : [])));
}
