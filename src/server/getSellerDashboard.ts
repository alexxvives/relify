import { investorProjectSelect, toInvestorProject } from "@/lib/investor-project";
import type { SabiYear } from "@/lib/sabi/insights";
import { prisma } from "@/server/db";
import { getSabiRegistry } from "@/server/sabiRegistry";
import { activeSellerProjectId } from "@/server/sellerCompany";

/**
 * t74: data for the seller Inicio dashboard. Only the seller's own active company is read
 * (ownerId filter), so nothing from other companies can reach this view. Years come from the
 * same closed project_year rows the report uses (SABI or typed by the seller).
 */
export type SellerDashboard = {
  years: SabiYear[];
  directors: number;
  shareholders: number;
};

export async function getSellerDashboard(ownerId: string): Promise<SellerDashboard> {
  const empty: SellerDashboard = { years: [], directors: 0, shareholders: 0 };
  const activeId = await activeSellerProjectId(ownerId);

  if (!activeId) {
    return empty;
  }

  const project = await prisma.project.findFirst({ where: { id: activeId, ownerId }, select: investorProjectSelect });

  if (!project) {
    return empty;
  }

  const registry = await getSabiRegistry(activeId);
  const years = (toInvestorProject(project).reportYears ?? []).filter(
    (year) => year.revenueCents !== null || year.ebitdaCents !== null || year.totalAssetsCents !== null,
  );

  return {
    years,
    directors: registry?.directors.length ?? 0,
    shareholders: registry?.shareholdings.length ?? 0,
  };
}
