import { prisma } from "@/lib/db";

export async function listInvestorNdaCompanies(
  investorId: string,
): Promise<{ slug: string; codename: string; region: string }[]> {
  const rows = await prisma.projectAccess.findMany({
    where: { investorId, ndaAcceptedAt: { not: null } },
    orderBy: { requestedAt: "desc" },
    select: {
      project: {
        select: { slug: true, codename: true, region: true, status: true },
      },
    },
  });

  return rows
    .filter((row) => row.project.status === "published")
    .map((row) => ({
      slug: row.project.slug,
      codename: row.project.codename,
      region: row.project.region,
    }));
}
