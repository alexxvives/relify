import { recentSince } from "@/lib/server/admin-seen";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { valuationCopy, type ValuationRequestStatus } from "@/lib/valuation-request";

export type AdminValuationRow = {
  id: string;
  cif: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  linkedAccount: boolean;
  status: ValuationRequestStatus;
  statusLabel: string;
  notes: string;
  projectId: string | null;
  createdAt: string;
  isNew: boolean;
};

export async function listValuationRequests(user: CurrentUser): Promise<AdminValuationRow[]> {
  if (!user.onboarded || user.role !== "admin") {
    return [];
  }

  const since = recentSince();
  const entries = await prisma.valuationRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cif: true,
      contactName: true,
      contactEmail: true,
      phone: true,
      userId: true,
      status: true,
      notes: true,
      projectId: true,
      createdAt: true,
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    cif: entry.cif,
    contactName: entry.contactName,
    contactEmail: entry.contactEmail,
    phone: entry.phone ?? "",
    linkedAccount: entry.userId !== null,
    status: entry.status,
    statusLabel: valuationCopy.status[entry.status],
    notes: entry.notes,
    projectId: entry.projectId,
    createdAt: entry.createdAt.toISOString(),
    isNew: entry.createdAt > since,
  }));
}
