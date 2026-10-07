import { groupSectorBooks, type IndustrySector } from "@/lib/cnae-section";
import { prisma } from "@/server/db";

export async function listPublishedSectors(): Promise<IndustrySector[]> {
  const rows = await prisma.projectCnae.findMany({
    where: { role: "principal", project: { status: "published" } },
    select: {
      code: true,
      project: { select: { slug: true, codename: true, revenueCents: true } },
    },
  });

  return groupSectorBooks(
    rows.map((row) => ({
      code: row.code,
      slug: row.project.slug,
      codename: row.project.codename,
      revenueCents: row.project.revenueCents,
    })),
  );
}
