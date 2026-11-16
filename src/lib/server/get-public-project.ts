import { cache } from "react";
import * as z from "zod";
import { prisma } from "@/lib/db";
import {
  publicProjectSelect,
  publicProjectWhere,
  toPublicProjectDetail,
  type PublicProjectDetail,
} from "@/lib/public-project";

const publicProjectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const getPublicProject = cache(
  async (slug: string): Promise<PublicProjectDetail | null> => {
    const parsed = publicProjectSlugSchema.safeParse(slug);

    if (!parsed.success) {
      return null;
    }

    const project = await prisma.project.findFirst({
      where: { slug: parsed.data, ...publicProjectWhere },
      select: { ...publicProjectSelect, successFee: { select: { id: true } } },
    });

    if (!project) {
      return null;
    }

    const { successFee, ...card } = project;
    return { ...toPublicProjectDetail(card), sold: successFee !== null };
  },
);
