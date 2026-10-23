import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export async function menuProcessCount(user: Pick<CurrentUser, "id" | "role">): Promise<number> {
  if (user.role === "investor") {
    return prisma.projectAccess.count({ where: { investorId: user.id, cancelledAt: null } });
  }

  if (user.role === "seller") {
    const projectId = await activeSellerProjectId(user.id);
    if (!projectId) {
      return 0;
    }
    return prisma.projectAccess.count({ where: { projectId, cancelledAt: null } });
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
