import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import { prisma } from "@/lib/db";

export type SellerFichaExtras = Pick<InvestorProjectProfile, "detailRows" | "indicatorRows" | "detailYears" | "photos"> & {
  /** t83: stored P&L and balance, so the preview keeps years outside the form window. */
  stored: Pick<InvestorProjectProfile, "incomeYears" | "incomeRows" | "balanceYears" | "balanceRows">;
};

/**
 * t81: the Ratios and "Resultado, cash flow y circulante" tables of the buyer ficha, read from the
 * stored accounts so the seller's "Ficha pública" preview matches what buyers see after the NDA.
 * Figures only (no names, no CIF). The caller scopes projectId to the signed-in seller.
 */
export async function getSellerFichaExtras(projectId: string): Promise<SellerFichaExtras | null> {
  const row = await prisma.project.findUnique({ where: { id: projectId }, select: investorProjectSelect });
  if (!row) {
    return null;
  }
  const profile = toInvestorProject(row);
  return {
    photos: profile.photos ?? [],
    detailRows: profile.detailRows ?? [], indicatorRows: profile.indicatorRows ?? [], detailYears: profile.balanceYears,
    stored: { incomeYears: profile.incomeYears, incomeRows: profile.incomeRows, balanceYears: profile.balanceYears, balanceRows: profile.balanceRows },
  };
}
