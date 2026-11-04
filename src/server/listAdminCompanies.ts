import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { materializePendingCompanies } from "@/server/sellerCompany";
import type { PublicProjectCard } from "@/lib/public-project";
import { cnaeTitle } from "@/lib/cnae-2009";
import { sellerFinancingChip, storedSellerFinancing } from "@/lib/seller-financing";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import {
  sectorMultiples,
  valuationSectorFromCnae,
} from "@/lib/valuation-multiples";
import { foundedDecade } from "@/lib/market-filters";
import { cardCovers } from "@/server/projectCardCover";

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
  /** Project razón social, or the registry prefill's while the seller has not saved the draft yet. */
  legalName: string;
  cif: string;
  createdMs: number;
  address: string;
  shareholders: string[];
  verified: boolean;
  isNew: boolean;
  /** CIF entered, SABI financials not imported yet. */
  sabiPending: boolean;
  sabiRequestedAt: string | null;
  /** Marketplace card data, unblurred for admin. */
  card: PublicProjectCard;
};

export async function listAdminCompanies(
  user: CurrentUser,
  since?: Date,
): Promise<AdminCompanyRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  // Sellers who verified a CIF before verify created the company still have it only on the user row.
  await materializePendingCompanies();

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
      sabiRequestedAt: true,
      sabiImportedAt: true,
      owner: {
        select: {
          email: true,
          registryPrefill: { select: { cif: true, legalName: true } },
        },
      },
      shareholders: { select: { name: true }, orderBy: { name: "asc" } },
      headcountRange: true,
      foundedYear: true,
      description: true,
      successFee: { select: { id: true } },
      cnaes: { select: { code: true }, orderBy: { position: "asc" }, take: 1 },
      sellerFinancing: true,
      sellerFinancingMaxPct: true,
      sellerFinancingYears: true,
    },
  });

  const covers = await cardCovers(projects);

  return projects.map((project) => {
    const code = project.cnaes[0]?.code ?? null;
    const sector = valuationSectorFromCnae(code ?? undefined);
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
      financingChip: sellerFinancingChip(storedSellerFinancing(project)),
      coverSrc: covers.get(project.id) ?? null,
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
      legalName:
        project.legalName.trim() ||
        (project.owner?.registryPrefill &&
        project.owner.registryPrefill.cif === project.cif
          ? project.owner.registryPrefill.legalName
          : ""),
      cif: project.cif,
      createdMs: project.createdAt.getTime(),
      address: project.address,
      shareholders: project.shareholders.map((holder) => holder.name),
      verified: project.verifiedAt !== null,
      isNew: since ? project.createdAt > since : false,
      sabiPending:
        project.cif.trim().length > 0 && project.sabiImportedAt === null,
      sabiRequestedAt: project.sabiRequestedAt?.toISOString() ?? null,
      card,
    };
  });
}
