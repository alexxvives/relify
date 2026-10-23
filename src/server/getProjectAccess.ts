import { cache } from "react";
import { projectAccessInputSchema, type ProjectAccessView } from "@/lib/project-access";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export const getProjectAccess = cache(async (user: CurrentUser, slug: string): Promise<ProjectAccessView> => {
  if (!user.onboarded || user.role !== "investor") {
    return "none";
  }

  const parsed = projectAccessInputSchema.safeParse({ slug });

  if (!parsed.success) {
    return "none";
  }

  const row = await prisma.projectAccess.findFirst({
    where: {
      investorId: user.id,
      project: { slug: parsed.data.slug, status: "published" },
    },
    select: { ndaAcceptedAt: true, sellerAcceptedAt: true, cancelledAt: true },
  });

  if (!row || row.cancelledAt !== null) {
    return "none";
  }

  if (row.sellerAcceptedAt === null) {
    return "awaiting-seller";
  }

  return row.ndaAcceptedAt === null ? "requested" : "accepted";
});
