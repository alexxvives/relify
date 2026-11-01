import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

/** Asesor sidebar bubble on Encargos: open requests nobody has claimed yet plus own claims still waiting for the deposit. */
export async function menuEncargoCount(
  user: Pick<CurrentUser, "id" | "role">,
): Promise<number> {
  if (user.role !== "advisor") {
    return 0;
  }
  const [open, waiting] = await Promise.all([
    prisma.advisoryEngagement.count({
      where: { advisorId: null, declinedAt: null, closedAt: null },
    }),
    prisma.advisoryEngagement.count({
      where: {
        advisorId: user.id,
        declinedAt: null,
        closedAt: null,
        depositPaidAt: null,
      },
    }),
  ]);
  return open + waiting;
}

export async function menuProcessCount(
  user: Pick<CurrentUser, "id" | "role">,
): Promise<number> {
  if (user.role === "investor") {
    return prisma.projectAccess.count({
      where: {
        investorId: user.id,
        cancelledAt: null,
        project: { successFee: null },
      },
    });
  }

  if (user.role === "seller") {
    const projectId = await activeSellerProjectId(user.id);
    if (!projectId) {
      return 0;
    }
    return prisma.projectAccess.count({
      where: { projectId, cancelledAt: null, project: { successFee: null } },
    });
  }

  if (user.role === "advisor") {
    const rows = await prisma.advisoryEngagement.findMany({
      where: {
        advisorId: user.id,
        declinedAt: null,
        OR: [{ depositPaidAt: { not: null } }, { closedAt: { not: null } }],
      },
      select: { projectId: true },
      distinct: ["projectId"],
    });
    return rows.length;
  }

  return 0;
}
