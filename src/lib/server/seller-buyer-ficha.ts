import * as z from "zod";

import type { PublicInvestorCard } from "@/lib/demo-profile";
import {
  investorProjectSelect,
  toInvestorProject,
  type InvestorProjectProfile,
} from "@/lib/investor-project";
import { labelAccesses, personName } from "@/lib/project-message";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { publicCardsByInvestor } from "@/lib/server/investor-profile";

export type SellerBuyerFicha = {
  company: InvestorProjectProfile;
  buyerLabel: string;
  buyerCard: PublicInvestorCard | null;
  /** S41: every buyer in this company's processes, so the ficha's buyer filter swaps cards without a page load. */
  buyers: { accessId: string; label: string; card: PublicInvestorCard | null }[];
};

const accessIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

// What the seller sees from a process's "Ver ficha": their company as buyers and advisors see
// it, plus the buyer's public card. Scoped to projects the seller owns.
export async function getSellerBuyerFicha(
  user: CurrentUser,
  accessId: string,
): Promise<SellerBuyerFicha | null> {
  const parsed = accessIdSchema.safeParse(accessId);

  if (!parsed.success || user.role !== "seller") {
    return null;
  }

  const access = await prisma.projectAccess.findFirst({
    where: {
      id: parsed.data,
      cancelledAt: null,
      project: { ownerId: user.id },
    },
    select: {
      projectId: true,
      investor: { select: { id: true, email: true, name: true, lastName: true } },
    },
  });

  if (!access) {
    return null;
  }

  const [companyRow, siblings] = await Promise.all([
    prisma.project.findUnique({
      where: { id: access.projectId },
      select: investorProjectSelect,
    }),
    prisma.projectAccess.findMany({
      where: { projectId: access.projectId, cancelledAt: null },
      select: {
        id: true,
        projectId: true,
        requestedAt: true,
        investor: { select: { id: true, email: true, name: true, lastName: true } },
      },
    }),
  ]);

  if (!companyRow) {
    return null;
  }

  // S41 (Alex): the buyer's real name everywhere; the numbered label only when the account has no name.
  const cards = await publicCardsByInvestor(siblings.map((row) => row.investor));
  const numbered = labelAccesses(siblings);
  const buyers = siblings.map((row) => ({
    accessId: row.id,
    label: personName(row.investor.name, row.investor.lastName).trim() || numbered.find((entry) => entry.id === row.id)?.label || "Comprador",
    card: cards.get(row.investor.id) ?? null,
  }));
  const current = buyers.find((row) => row.accessId === parsed.data);

  return {
    company: toInvestorProject(companyRow),
    buyerLabel: current?.label ?? "Comprador",
    buyerCard: current?.card ?? null,
    buyers,
  };
}
