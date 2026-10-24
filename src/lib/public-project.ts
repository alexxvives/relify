import type { SectorImageKey } from "@/lib/sector-image";
import type { Prisma } from "@/generated/prisma/client";
import { catalogCopy } from "./catalog-copy";

export const publicProjectWhere = {
  status: "published",
} satisfies Prisma.ProjectWhereInput;

export const publicProjectSelect = {
  slug: true,
  codename: true,
  region: true,
  revenueCents: true,
  ebitdaCents: true,
  adjustedEbitdaCents: true,
  askingPriceCents: true,
} satisfies Prisma.ProjectSelect;

export type PublicProjectCard = {
  slug: string;
  codename: string;
  region: string;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  coverSrc?: string | null;
  sectorKey?: SectorImageKey;
  verified?: boolean;
  sold?: boolean;
};

export type PublicProjectDetail = PublicProjectCard & {
  lockedFinancials: typeof catalogCopy.lockedFinancials;
};

export function otherPublishedProjects(projects: PublicProjectCard[], slug: string): PublicProjectCard[] {
  return projects.filter((project) => project.slug !== slug);
}

export function toPublicProjectDetail(card: PublicProjectCard): PublicProjectDetail {
  return {
    ...card,
    lockedFinancials: catalogCopy.lockedFinancials,
  };
}
