import { cache } from "react";
import {
  accessFromConnection,
  projectAccessInputSchema,
  type ProjectAccessView,
} from "@/lib/project-access";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export const getProjectAccess = cache(
  async (user: CurrentUser, slug: string): Promise<ProjectAccessView> => {
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
      select: {
        ndaAcceptedAt: true,
        sellerAcceptedAt: true,
        cancelledAt: true,
      },
    });

    return accessFromConnection(row);
  },
);
