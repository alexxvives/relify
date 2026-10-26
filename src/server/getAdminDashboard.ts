import type { IndustrySector } from "@/lib/cnae-section";
import type { CurrentUser } from "@/server/getCurrentUser";
import { countInvestorPlans, type InvestorPlanCount } from "@/server/getAdminBilling";
import { prisma } from "@/server/db";
import { listPublishedSectors } from "@/server/listPublishedSectors";

const roleOrder = ["seller", "investor", "advisor", "admin"] as const;

export type AdminRoleCount = { role: (typeof roleOrder)[number] | "none"; count: number };

export type AdminDashboard = {
  roles: AdminRoleCount[];
  unfinished: number;
  published: number;
  drafts: number;
  pending: number;
  publishedAskingCents: number;
  accesses: number;
  ndas: number;
  messages: number;
  favorites: number;
  quotes: number;
  plans: InvestorPlanCount[];
  sectors: IndustrySector[];
};

function roleKey(role: string | null): AdminRoleCount["role"] {
  if (role === "seller" || role === "investor" || role === "advisor" || role === "admin") {
    return role;
  }

  return "none";
}

export async function getAdminDashboard(user: CurrentUser): Promise<AdminDashboard | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const [users, unfinished, statuses, accesses, ndas, messages, favorites, quotes, plans, sectors] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.count({ where: { onboardedAt: null } }),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.projectAccess.count(),
    prisma.projectAccess.count({ where: { ndaAcceptedAt: { not: null } } }),
    prisma.projectMessage.count(),
    prisma.projectFavorite.count(),
    prisma.advisoryQuote.count(),
    countInvestorPlans(),
    listPublishedSectors(),
  ]);
  const roleCounts = new Map<AdminRoleCount["role"], number>();

  for (const row of users) {
    const key = roleKey(row.role);
    roleCounts.set(key, (roleCounts.get(key) ?? 0) + row._count._all);
  }

  const statusCounts = new Map(statuses.map((row) => [row.status, row._count._all]));

  return {
    roles: [
      ...roleOrder.map((role) => ({ role, count: roleCounts.get(role) ?? 0 })),
      { role: "none", count: roleCounts.get("none") ?? 0 },
    ],
    unfinished,
    published: statusCounts.get("published") ?? 0,
    drafts: statusCounts.get("draft") ?? 0,
    pending: statusCounts.get("pending") ?? 0,
    // Same set as the "Sectores en venta" treemap (published, unsold, with a CNAE) so both totals always agree.
    publishedAskingCents: sectors.reduce((sum, sector) => sum + (sector.revenueCents ?? 0), 0),
    accesses,
    ndas,
    messages,
    favorites,
    quotes,
    plans,
    sectors,
  };
}
