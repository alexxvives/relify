import { prisma } from "@/server/db";
import type { PublicProjectCard } from "@/lib/public-project";
import { publicProjectSelect, publicProjectWhere } from "@/lib/public-project";
import { cnaeTitle } from "@/lib/cnae-2009";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import { sectorMultiples, valuationSectorFromCnae } from "@/lib/valuation-multiples";
import { foundedDecade } from "@/lib/market-filters";
import { projectCoverHref, projectCoverIsStored, projectCoverVersion } from "@/server/projectCover";

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
    },
    orderBy: { codename: "asc" },
  });

  return rows.map((row) => {
    const code = row.cnaes[0]?.code ?? null;
    const sector = valuationSectorFromCnae(code ?? undefined);
    const version = projectCoverIsStored(row.id) ? projectCoverVersion(row.id) : null;

    return {
      slug: row.slug,
      codename: row.codename,
      region: row.region,
      revenueCents: row.revenueCents,
      ebitdaCents: row.ebitdaCents,
      adjustedEbitdaCents: row.adjustedEbitdaCents,
      askingPriceCents: row.askingPriceCents,
      sectorKey: sectorKeyFromCnae(row.cnaes[0]?.code),
      verified: row.verifiedAt !== null,
      sector,
      sectorLabel: sectorMultiples[sector].label,
      headcount: row.headcountRange,
      foundedDecade: foundedDecade(row.foundedYear),
      cnaeCode: code,
      cnaeTitle: code ? cnaeTitle(code) : null,
      summary: row.description?.trim() || null,
      coverSrc: version ? projectCoverHref(row.slug, version) : null,
    };
  });
}
