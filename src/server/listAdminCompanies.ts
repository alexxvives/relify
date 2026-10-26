import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import type { PublicProjectCard } from "@/lib/public-project";
import { cnaeTitle } from "@/lib/cnae-2009";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import { sectorMultiples, valuationSectorFromCnae } from "@/lib/valuation-multiples";
import { foundedDecade } from "@/lib/market-filters";
import { projectCoverHref, projectCoverIsStored, projectCoverVersion } from "@/server/projectCover";

export type AdminCompanyRow = {
  id: string;
  slug: string;
  codename: string;
  region: string;
  status: "draft" | "pending" | "published";
  askingPriceCents: number;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ownerEmail: string | null;
  legalName: string;
  cif: string;
  address: string;
  shareholders: string[];
  verified: boolean;
  isNew: boolean;
  /** Marketplace card data, unblurred for admin. */
  card: PublicProjectCard;
};

export async function listAdminCompanies(user: CurrentUser, since?: Date): Promise<AdminCompanyRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      verifiedAt: true,
      createdAt: true,
      slug: true,
      codename: true,
      region: true,
      status: true,
      askingPriceCents: true,
      revenueCents: true,
      ebitdaCents: true,
      adjustedEbitdaCents: true,
      legalName: true,
      cif: true,
      address: true,
      owner: { select: { email: true } },
      shareholders: { select: { name: true }, orderBy: { name: "asc" } },
      headcountRange: true,
      foundedYear: true,
      description: true,
      successFee: { select: { id: true } },
      cnaes: { select: { code: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  return projects.map((project) => {
    const code = project.cnaes[0]?.code ?? null;
    const sector = valuationSectorFromCnae(code ?? undefined);
    const version = projectCoverIsStored(project.id) ? projectCoverVersion(project.id) : null;
    const card: PublicProjectCard = {
      slug: project.slug,
      codename: project.codename,
      region: project.region,
      revenueCents: project.revenueCents,
      ebitdaCents: project.ebitdaCents,
      adjustedEbitdaCents: project.adjustedEbitdaCents,
      askingPriceCents: project.askingPriceCents,
      sectorKey: sectorKeyFromCnae(code ?? undefined),
      verified: project.verifiedAt !== null,
      sold: project.successFee !== null,
      sector,
      sectorLabel: sectorMultiples[sector].label,
      headcount: project.headcountRange,
      foundedDecade: foundedDecade(project.foundedYear),
      cnaeCode: code,
      cnaeTitle: code ? cnaeTitle(code) : null,
      summary: project.description?.trim() || null,
      coverSrc: version ? projectCoverHref(project.slug, version) : null,
    };

    return {
    id: project.id,
    slug: project.slug,
    codename: project.codename,
    region: project.region,
    status: project.status,
    askingPriceCents: project.askingPriceCents,
    revenueCents: project.revenueCents,
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    ownerEmail: project.owner?.email ?? null,
    legalName: project.legalName,
    cif: project.cif,
    address: project.address,
    shareholders: project.shareholders.map((holder) => holder.name),
    verified: project.verifiedAt !== null,
    isNew: since ? project.createdAt > since : false,
    card,
  };
  });
}
