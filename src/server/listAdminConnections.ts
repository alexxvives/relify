import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type AdminConnectionRow = {
  id: string;
  codename: string;
  investorEmail: string;
  nda: boolean;
  accepted: boolean;
  requestedAt: Date;
};

export async function listAdminConnections(user: CurrentUser): Promise<AdminConnectionRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const connections = await prisma.projectAccess.findMany({
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      requestedAt: true,
      sellerAcceptedAt: true,
      ndaAcceptedAt: true,
      investor: { select: { email: true } },
      project: { select: { codename: true } },
    },
  });

  return connections.map((connection) => ({
    id: connection.id,
    codename: connection.project.codename,
    investorEmail: connection.investor.email,
    nda: connection.ndaAcceptedAt !== null,
    accepted: connection.sellerAcceptedAt !== null,
    requestedAt: connection.requestedAt,
  }));
}
