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
};

export async function getAdminOverview(): Promise<AdminOverview> {
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
  };
}
