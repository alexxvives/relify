import { prisma } from "@/server/db";
import type { PublicProjectCard } from "@/lib/public-project";
import { publicProjectSelect, publicProjectWhere } from "@/lib/public-project";
import { cnaeCardFields } from "@/lib/cnae-2009";
import { sellerFinancingChip, storedSellerFinancing } from "@/lib/seller-financing";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import {
  sectorMultiples,
  valuationSectorFromCnae,
} from "@/lib/valuation-multiples";
import { foundedDecade } from "@/lib/market-filters";
import { cardCovers } from "@/server/projectCardCover";
import { projectHasAdjustments } from "@/lib/seller-draft-guard";

export async function listPublicProjects(): Promise<PublicProjectCard[]> {
  const rows = await prisma.project.findMany({
    where: { ...publicProjectWhere, successFee: null },
    select: {
      id: true,
      ...publicProjectSelect,
      verifiedAt: true,
      headcountRange: true,
      foundedYear: true,
      description: true,
      cnaes: { select: { code: true }, orderBy: { position: "asc" }, take: 1 },
      sellerFinancing: true,
      sellerFinancingMaxPct: true,
      sellerFinancingYears: true,
      ebitdaAdjustments: true,
    },
    orderBy: { codename: "asc" },
  });

  const covers = await cardCovers(rows);

  return rows.map((row) => {
    const code = row.cnaes[0]?.code ?? null;
    const sector = valuationSectorFromCnae(code ?? undefined);

    return {
      slug: row.slug,
      codename: row.codename,
      region: row.region,
      revenueCents: row.revenueCents,
      ebitdaCents: row.ebitdaCents,
      adjustedEbitdaCents: row.adjustedEbitdaCents,
      hasAdjustments: projectHasAdjustments(row),
      askingPriceCents: row.askingPriceCents,
      sectorKey: sectorKeyFromCnae(row.cnaes[0]?.code),
      verified: row.verifiedAt !== null,
      sector,
      sectorLabel: sectorMultiples[sector].label,
      headcount: row.headcountRange,
      foundedDecade: foundedDecade(row.foundedYear),
      ...(code ? cnaeCardFields(code, sectorMultiples[sector].label) : { cnaeCode: null, cnaeTitle: null }),
      summary: row.description?.trim() || null,
      financingChip: sellerFinancingChip(storedSellerFinancing(row)),
      coverSrc: covers.get(row.id) ?? null,
    };
  });
}
