import type { PendingMatch } from "@/lib/billing";
import { labelAccesses, personName } from "@/lib/project-message";
import { prisma } from "@/server/db";

export type { PendingMatch };

export async function listPendingMatches(
  ownerId: string,
  projectId?: string | null,
): Promise<PendingMatch[]> {
  const rows = await prisma.projectAccess.findMany({
    where: {
      cancelledAt: null,
      project: projectId
        ? { id: projectId, ownerId, status: "published" }
        : { ownerId, status: "published" },
    },
    select: {
      id: true,
      projectId: true,
      requestedAt: true,
      investor: { select: { name: true, lastName: true } },
      sellerAcceptedAt: true,
      project: { select: { codename: true } },
    },
    orderBy: { requestedAt: "asc" },
  });
  // Alex (t32): sellers see the buyer's real name from the request on.
  const labeled = labelAccesses(
    rows.map((row) => ({
      ...row,
      connectedName: personName(row.investor.name, row.investor.lastName),
    })),
  ).filter((row) => row.sellerAcceptedAt === null);

  return labeled.map((row) => ({
    accessId: row.id,
    codename: row.project.codename,
    label: row.label,
  }));
}
