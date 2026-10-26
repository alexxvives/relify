import { prisma } from "@/server/db";

export type SellerFunnel = { views: number; requests: number; ndas: number; lois: number; daysListed: number | null };
export type InvestorFunnel = { favorites: number; requests: number; active: number; ndas: number };

const dayMs = 86_400_000;

/** Funnel for the seller's active company: who looked, who asked, who committed. */
export async function sellerFunnel(ownerId: string, projectId: string | null): Promise<SellerFunnel> {
  const empty = { views: 0, requests: 0, ndas: 0, lois: 0, daysListed: null };
  if (!projectId) return empty;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { status: true, createdAt: true, verifiedAt: true },
  });
  if (!project) return empty;
  const [views, requests, ndas, lois] = await Promise.all([
    prisma.projectView.count({ where: { projectId } }),
    prisma.projectAccess.count({ where: { projectId } }),
    prisma.projectAccess.count({ where: { projectId, ndaAcceptedAt: { not: null } } }),
    prisma.projectAccess.count({ where: { projectId, loiSignedAt: { not: null } } }),
  ]);
  const listed = project.verifiedAt ?? project.createdAt;
  const daysListed = project.status === "published" ? Math.max(0, Math.floor((Date.now() - listed.getTime()) / dayMs)) : null;
  return { views, requests, ndas, lois, daysListed };
}

export async function investorFunnel(investorId: string): Promise<InvestorFunnel> {
  const [favorites, requests, active, ndas] = await Promise.all([
    prisma.projectFavorite.count({ where: { investorId } }),
    prisma.projectAccess.count({ where: { investorId } }),
    prisma.projectAccess.count({ where: { investorId, sellerAcceptedAt: { not: null }, cancelledAt: null } }),
    prisma.projectAccess.count({ where: { investorId, ndaAcceptedAt: { not: null } } }),
  ]);
  return { favorites, requests, active, ndas };
}
