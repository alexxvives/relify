import * as z from "zod";

import type { PublicInvestorCard } from "@/lib/demo-profile";
import {
  investorProjectSelect,
  toInvestorProject,
  type InvestorProjectProfile,
} from "@/lib/investor-project";
import { labelAccesses } from "@/lib/project-message";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { publicCardsByInvestor } from "@/server/investorProfile";

export type SellerBuyerFicha = {
  company: InvestorProjectProfile;
  buyerLabel: string;
  buyerCard: PublicInvestorCard | null;
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
      investor: { select: { id: true, email: true } },
    },
  });

  if (!access) {
    return null;
  }

  const [companyRow, siblings, cards] = await Promise.all([
    prisma.project.findUnique({
      where: { id: access.projectId },
      select: investorProjectSelect,
    }),
    prisma.projectAccess.findMany({
      where: { projectId: access.projectId, cancelledAt: null },
      select: { id: true, projectId: true, requestedAt: true },
    }),
    publicCardsByInvestor([access.investor]),
  ]);

  if (!companyRow) {
    return null;
  }

  const label =
    labelAccesses(siblings).find((row) => row.id === parsed.data)?.label ??
    "Comprador";

  return {
    company: toInvestorProject(companyRow),
    buyerLabel: label,
    buyerCard: cards.get(access.investor.id) ?? null,
  };
}
