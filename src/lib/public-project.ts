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
  /** True when an admin has accepted at least one EBITDA adjustment. The card then shows EBITDA aj. */
  hasAdjustments?: boolean;
  /** True when a row is still waiting for Relify. The card keeps reported EBITDA and says "Ajuste en revisión". */
  hasPendingAdjustments?: boolean;
  askingPriceCents: number;
  coverSrc?: string | null;
  sectorKey?: SectorImageKey;
  verified?: boolean;
  sold?: boolean;
  /** Broad sector (valuation-multiples group) for chips and the Sector filter. */
  sector?: string;
  sectorLabel?: string;
  headcount?: string | null;
  /** Decade only ("los 90"), so the year alone cannot identify the company. */
  foundedDecade?: string | null;
  /** Main CNAE 2009 activity, shown on the card as "56.10 · Restaurantes…". */
  cnaeCode?: string | null;
  cnaeTitle?: string | null;
  /** The seller's short public description, clamped on the card. */
  summary?: string | null;
  /** t92: "Financia hasta 20 %" / "Financiación vendedor" when the seller accepts (or would negotiate) a vendor loan. */
  financingChip?: string | null;
  /** t95b: false when the stored basis (adjusted EBITDA if adjusted, else EBITDA) is not positive; seller/admin views only. */
  publishable?: boolean;
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
