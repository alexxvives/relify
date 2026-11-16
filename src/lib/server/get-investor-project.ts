import { cache } from "react";
import * as z from "zod";
import {
  investorProjectSelect,
  toInvestorProject,
  type InvestorProjectProfile,
} from "@/lib/investor-project";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

const projectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const getInvestorProject = cache(
  async (
    user: CurrentUser,
    slug: string,
  ): Promise<InvestorProjectProfile | null> => {
    if (!user.onboarded || user.role !== "investor") {
      return null;
    }

    const parsed = projectSlugSchema.safeParse(slug);

    if (!parsed.success) {
      return null;
    }

    const project = await prisma.project.findFirst({
      where: { slug: parsed.data, status: "published" },
      select: investorProjectSelect,
    });

    if (!project) {
      return null;
    }

    const profile = toInvestorProject(project);
    // t84: buyers never receive photos an admin has hidden.
    return { ...profile, photos: (profile.photos ?? []).filter((photo) => !photo.hidden) };
  },
);
