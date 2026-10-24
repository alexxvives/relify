import { sellerCopy } from "@/lib/seller-copy";
import { personName } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

export type CancelledProcess = {
  accessId: string;
  slug: string;
  title: string;
  cancelledAt: Date;
  cancelledBy: "seller" | "investor" | null;
};

function cancelledBy(value: string | null): CancelledProcess["cancelledBy"] {
  return value === "seller" || value === "investor" ? value : null;
}

// Cancelled processes stay visible to both sides, read-only, so nobody loses
// track of who stopped a deal and when.
export async function listCancelledProcesses(user: CurrentUser): Promise<CancelledProcess[]> {
  if (!user.onboarded) {
    return [];
  }

  if (user.role === "investor") {
    const rows = await prisma.projectAccess.findMany({
      where: { investorId: user.id, cancelledAt: { not: null } },
      select: { id: true, cancelledAt: true, cancelledBy: true, project: { select: { slug: true, codename: true } } },
      orderBy: { cancelledAt: "desc" },
    });

    return rows.map((row) => ({
      accessId: row.id,
      slug: row.project.slug,
      title: row.project.codename,
      cancelledAt: row.cancelledAt ?? new Date(0),
      cancelledBy: cancelledBy(row.cancelledBy),
    }));
  }

  if (user.role === "seller") {
    const projectId = await activeSellerProjectId(user.id);

    if (!projectId) {
      return [];
    }

    const rows = await prisma.projectAccess.findMany({
      where: { projectId, project: { ownerId: user.id }, cancelledAt: { not: null } },
      select: {
        id: true,
        cancelledAt: true,
        cancelledBy: true,
        sellerAcceptedAt: true,
        ndaAcceptedAt: true,
        project: { select: { slug: true } },
        investor: { select: { name: true, lastName: true } },
      },
      orderBy: { cancelledAt: "desc" },
    });

    return rows.map((row) => ({
      accessId: row.id,
      slug: row.project.slug,
      // Same rule as active threads: the buyer's name only after the NDA.
      title:
        row.sellerAcceptedAt !== null && row.ndaAcceptedAt !== null
          ? personName(row.investor.name, row.investor.lastName) || sellerCopy.investorParty
          : sellerCopy.investorParty,
      cancelledAt: row.cancelledAt ?? new Date(0),
      cancelledBy: cancelledBy(row.cancelledBy),
    }));
  }

  return [];
}
