import { investorProjectSelect, toInvestorProject, type InvestorProjectProfile } from "@/lib/investor-project";
import { prisma } from "@/server/db";

export type SellerFichaExtras = Pick<InvestorProjectProfile, "detailRows" | "indicatorRows" | "detailYears">;

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
  return { detailRows: profile.detailRows ?? [], indicatorRows: profile.indicatorRows ?? [], detailYears: profile.balanceYears };
}
