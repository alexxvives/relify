import { groupSectors, type IndustrySector } from "@/lib/cnae-section";
import { prisma } from "@/server/db";

export async function listPublishedSectors(): Promise<IndustrySector[]> {
  const rows = await prisma.projectCnae.findMany({
    where: { role: "principal", project: { status: "published" } },
    select: { code: true },
  });

  return groupSectors(rows.map((row) => row.code));
}
