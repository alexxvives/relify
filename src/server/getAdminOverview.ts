import {
  advisorRankJustification,
  advisorScoreBreakdown,
  sortPublicAdvisors,
  toPublicAdvisorCard,
  type AdvisorScoreBreakdown,
  type PublicAdvisorCard,
} from "@/lib/advisor-directory";
import type { IndustrySector } from "@/lib/cnae-section";
import { prisma } from "@/server/db";
import { listPublishedSectors } from "@/server/listPublishedSectors";

const roleOrder = ["seller", "investor", "advisor", "admin"] as const;
const planOrder = ["none", "limited", "unlimited"] as const;

export type AdminOverview = {
  roles: { role: (typeof roleOrder)[number] | "none"; count: number }[];
  unfinished: number;
  published: number;
  drafts: number;
  publishedAskingCents: number;
  accesses: number;
  ndas: number;
  messages: number;
  favorites: number;
  quotes: number;
  plans: { plan: (typeof planOrder)[number]; count: number }[];
  sectors: IndustrySector[];
  projects: {
    id: string;
    codename: string;
    region: string;
    status: "draft" | "pending" | "published";
    askingPriceCents: number;
    ownerEmail: string | null;
    legalName: string;
    cif: string;
    address: string;
    shareholders: string[];
    fileNames: string[];
  }[];
  accounts: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    onboarded: boolean;
    suspended: boolean;
    plan: "none" | "limited" | "unlimited";
  }[];
  connections: {
    id: string;
    codename: string;
    investorEmail: string;
    nda: boolean;
    accepted: boolean;
    requestedAt: Date;
  }[];
  advisors: AdminAdvisorRow[];
};

export type AdminAdvisorRow = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  listed: boolean;
  place: number | null;
  total: number;
  breakdown: AdvisorScoreBreakdown | null;
  justification: string;
};

function personName(name: string, lastName: string | null): string {
  return [name, lastName ?? ""].filter((part) => part.trim().length > 0).join(" ");
}

async function loadAdminAdvisorRanks(): Promise<AdminAdvisorRow[]> {
  const advisors = await prisma.user.findMany({
    where: { role: "advisor" },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      advisorProfile: {
        select: {
          userId: true,
          businessName: true,
          nif: true,
          postalCode: true,
          description: true,
          sectors: true,
          services: true,
          closedOperations: true,
        },
      },
    },
  });
  const ids = advisors.map((advisor) => advisor.id);
  const messages =
    ids.length === 0
      ? []
      : await prisma.engagementMessage.findMany({
          where: { author: "advisor", engagement: { advisorId: { in: ids } } },
          select: { body: true, engagement: { select: { advisorId: true } } },
        });
  const bodies = new Map<string, string[]>();

  for (const message of messages) {
    const advisorId = message.engagement.advisorId;

    if (!advisorId) {
      continue;
    }

    const current = bodies.get(advisorId) ?? [];
    current.push(message.body);
    bodies.set(advisorId, current);
  }

  const breakdownById = new Map<string, AdvisorScoreBreakdown>();
  const cards: PublicAdvisorCard[] = [];

  for (const advisor of advisors) {
    if (!advisor.advisorProfile) {
      continue;
    }

    const card = toPublicAdvisorCard(advisor.advisorProfile);

    if (!card) {
      continue;
    }

    cards.push(card);
    breakdownById.set(card.id, advisorScoreBreakdown(card, bodies.get(card.id) ?? []));
  }

  const ranked = sortPublicAdvisors(cards, "recommended", (id) => breakdownById.get(id)?.reliability ?? 100);
  const placeById = new Map(ranked.map((card, index) => [card.id, index + 1]));
  const total = ranked.length;

  return advisors
    .map((advisor) => {
      const card = advisor.advisorProfile ? toPublicAdvisorCard(advisor.advisorProfile) : null;
      const breakdown = card ? (breakdownById.get(card.id) ?? null) : null;
      const place = card ? (placeById.get(card.id) ?? null) : null;

      return {
        id: advisor.id,
        name: personName(advisor.name, advisor.lastName),
        email: advisor.email,
        businessName: advisor.advisorProfile?.businessName.trim() ?? "",
        listed: card !== null,
        place,
        total,
        breakdown,
        justification:
          breakdown && place !== null
            ? advisorRankJustification(place, total, breakdown)
            : "No entra en el ranking porque la ficha no está completa.",
      };
    })
    .sort((left, right) => {
      if (left.place === null && right.place === null) {
        return left.name.localeCompare(right.name, "es");
      }

      if (left.place === null) {
        return 1;
      }

      if (right.place === null) {
        return -1;
      }

      return left.place - right.place;
    });
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const advisorRanksPromise = loadAdminAdvisorRanks();
  const [users, unfinished, published, drafts, asking, accesses, ndas, messages, favorites, quotes, plans, sectors, projects, accounts, connections] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count({ where: { onboardedAt: null } }),
      prisma.project.count({ where: { status: "published" } }),
      prisma.project.count({ where: { status: "draft" } }),
      prisma.project.aggregate({ where: { status: "published" }, _sum: { askingPriceCents: true } }),
      prisma.projectAccess.count(),
      prisma.projectAccess.count({ where: { ndaAcceptedAt: { not: null } } }),
      prisma.projectMessage.count(),
      prisma.projectFavorite.count(),
      prisma.advisoryQuote.count(),
      prisma.billingCustomer.groupBy({ by: ["plan"], _count: { _all: true } }),
      listPublishedSectors(),
      prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          codename: true,
          region: true,
          status: true,
          askingPriceCents: true,
          legalName: true,
          cif: true,
          address: true,
          owner: { select: { email: true } },
          shareholders: { select: { name: true }, orderBy: { name: "asc" } },
          dataRoomFiles: { select: { fileName: true }, orderBy: { createdAt: "asc" } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          role: true,
          onboardedAt: true,
          suspendedAt: true,
          billingCustomer: { select: { plan: true } },
        },
      }),
      prisma.projectAccess.findMany({
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          requestedAt: true,
          sellerAcceptedAt: true,
          ndaAcceptedAt: true,
          investor: { select: { email: true } },
          project: { select: { codename: true } },
        },
      }),
    ]);
  const advisors = await advisorRanksPromise;

  const roleCounts = new Map(users.map((row) => [row.role ?? "none", row._count._all]));
  const planCounts = new Map(plans.map((row) => [row.plan, row._count._all]));

  return {
    roles: [
      ...roleOrder.map((role) => ({ role, count: roleCounts.get(role) ?? 0 })),
      { role: "none" as const, count: roleCounts.get("none") ?? 0 },
    ],
    unfinished,
    published,
    drafts,
    publishedAskingCents: asking._sum.askingPriceCents ?? 0,
    accesses,
    ndas,
    messages,
    favorites,
    quotes,
    plans: planOrder.map((plan) => ({ plan, count: planCounts.get(plan) ?? 0 })),
    sectors,
    projects: projects.map((project) => ({
      id: project.id,
      codename: project.codename,
      region: project.region,
      status: project.status,
      askingPriceCents: project.askingPriceCents,
      ownerEmail: project.owner?.email ?? null,
      legalName: project.legalName,
      cif: project.cif,
      address: project.address,
      shareholders: project.shareholders.map((holder) => holder.name),
      fileNames: project.dataRoomFiles.map((file) => file.fileName),
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: [account.name, account.lastName].filter((part) => part && part.trim().length > 0).join(" "),
      email: account.email,
      role: account.role,
      onboarded: account.onboardedAt !== null,
      suspended: account.suspendedAt !== null,
      plan: account.billingCustomer?.plan ?? "none",
    })),
    connections: connections.map((connection) => ({
      id: connection.id,
      codename: connection.project.codename,
      investorEmail: connection.investor.email,
      nda: connection.ndaAcceptedAt !== null,
      accepted: connection.sellerAcceptedAt !== null,
      requestedAt: connection.requestedAt,
    })),
    advisors,
  };
}
