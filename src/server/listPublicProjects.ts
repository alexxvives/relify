import { prisma } from "@/server/db";
import type { PublicProjectCard } from "@/lib/public-project";
import { publicProjectSelect, publicProjectWhere } from "@/lib/public-project";
import { projectCoverHref, projectCoverIsStored, projectCoverVersion } from "@/server/projectCover";

export async function listPublicProjects(): Promise<PublicProjectCard[]> {
  const rows = await prisma.project.findMany({
    where: publicProjectWhere,
    select: { id: true, ...publicProjectSelect },
    orderBy: { codename: "asc" },
  });

  return rows.map((row) => {
    const version = projectCoverIsStored(row.id) ? projectCoverVersion(row.id) : null;

    return {
      slug: row.slug,
      codename: row.codename,
      region: row.region,
      revenueCents: row.revenueCents,
      ebitdaCents: row.ebitdaCents,
      adjustedEbitdaCents: row.adjustedEbitdaCents,
      askingPriceCents: row.askingPriceCents,
      coverSrc: version ? projectCoverHref(row.slug, version) : null,
    };
  });
}
