import { cache } from "react";
import * as z from "zod";
import { prisma } from "@/server/db";
import { publicProjectSelect, publicProjectWhere, toPublicProjectDetail, type PublicProjectDetail } from "@/lib/public-project";

const publicProjectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const getPublicProject = cache(async (slug: string): Promise<PublicProjectDetail | null> => {
  const parsed = publicProjectSlugSchema.safeParse(slug);

  if (!parsed.success) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: { slug: parsed.data, ...publicProjectWhere },
    select: publicProjectSelect,
  });

  if (!project) {
    return null;
  }

  return toPublicProjectDetail(project);
});
