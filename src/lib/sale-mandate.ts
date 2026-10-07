import type { PublicProjectCard } from "./public-project";

export function toMandateView(
  project: PublicProjectCard & {
    legalName?: string;
    cif?: string;
    address?: string;
    fileName?: string;
  },
): PublicProjectCard {
  return {
    slug: project.slug,
    codename: project.codename,
    region: project.region,
    revenueCents: project.revenueCents,
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    askingPriceCents: project.askingPriceCents,
  };
}
