import { prisma } from "@/server/db";
import type { PublicProjectCard } from "@/lib/public-project";
import { publicProjectSelect, publicProjectWhere } from "@/lib/public-project";

export async function listPublicProjects(): Promise<PublicProjectCard[]> {
  return prisma.project.findMany({
    where: publicProjectWhere,
    select: publicProjectSelect,
    orderBy: { codename: "asc" },
  });
}
