import type { ShowcaseDeal, ShowcaseSector } from "@/lib/landing-copy";
import type { PublicProjectCard } from "@/lib/public-project";
import type { SectorImageKey } from "@/lib/sector-image";
import type { HeadcountRangeId } from "@/lib/company-profile";

/** Specimen CNAE + copy so the landing preview matches a real marketplace card, without identifying a company. */
const extras: readonly {
  cnaeCode: string;
  cnaeTitle: string;
  summary: string;
  headcount: HeadcountRangeId;
  financingChip: string | null;
}[] = [
  {
    cnaeCode: "47.11",
    cnaeTitle: "Comercio al por menor en establecimientos no especializados",
    summary: "Negocio de proximidad con venta recurrente y un equipo reducido en zona urbana.",
    headcount: "band_6_10",
    financingChip: "Financiación vendedor",
  },
  {
    cnaeCode: "96.02",
    cnaeTitle: "Peluquería y otros tratamientos de belleza",
    summary: "Servicios locales con clientela habitual y baja dependencia de un único canal.",
    headcount: "band_1_5",
    financingChip: null,
  },
  {
    cnaeCode: "45.20",
    cnaeTitle: "Mantenimiento y reparación de vehículos de motor",
    summary: "Taller con cartera de flotas y particulares. Recurrencia alta y local consolidado.",
    headcount: "band_6_10",
    financingChip: "Financia hasta 20 %",
  },
  {
    cnaeCode: "47.76",
    cnaeTitle: "Comercio al por menor de flores, plantas y semillas",
    summary: "Punto de venta especializado con temporada marcada y clientela de barrio.",
    headcount: "band_1_5",
    financingChip: null,
  },
  {
    cnaeCode: "46.19",
    cnaeTitle: "Intermediarios del comercio de productos diversos",
    summary: "Distribución B2B con margen estable y una cartera de clientes industriales.",
    headcount: "band_11_20",
    financingChip: "Financiación vendedor",
  },
  {
    cnaeCode: "70.22",
    cnaeTitle: "Otras actividades de consultoría de gestión empresarial",
    summary: "Servicios profesionales a pymes, con contratos recurrentes y equipo senior.",
    headcount: "band_6_10",
    financingChip: null,
  },
  {
    cnaeCode: "10.71",
    cnaeTitle: "Fabricación de pan y de productos frescos de panadería y pastelería",
    summary: "Obrador con venta propia y a hostelería. Demanda local y procesos ya definidos.",
    headcount: "band_11_20",
    financingChip: null,
  },
  {
    cnaeCode: "47.19",
    cnaeTitle: "Otro comercio al por menor en establecimientos no especializados",
    summary: "Retail de proximidad con ticket medio estable y un local en calle comercial.",
    headcount: "band_6_10",
    financingChip: "Financiación vendedor",
  },
];

function sectorLabel(sector: ShowcaseSector): string {
  return sector.charAt(0).toUpperCase() + sector.slice(1);
}

/**
 * Showcase strings are "240K €" or "4,8M €". Cents match `formatCardEur` on the live card.
 */
export function parseShowcaseMoney(value: string): number {
  const compact = value.replace(/\s/g, "").replace("€", "").toLowerCase();
  if (compact.includes("m")) {
    const n = Number.parseFloat(compact.replace("m", "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 1_000_000 * 100) : 0;
  }
  if (compact.includes("k")) {
    const n = Number.parseFloat(compact.replace("k", "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 1_000 * 100) : 0;
  }
  const n = Number.parseFloat(compact.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Maps a landing specimen to the same card shape the marketplace grid renders. */
function extraFor(index: number) {
  const found = extras[index % extras.length];
  if (found) {
    return found;
  }
  throw new Error("showcase extras must not be empty");
}

export function showcaseToProjectCard(deal: ShowcaseDeal, index: number): PublicProjectCard {
  const extra = extraFor(index);
  const revenueCents = parseShowcaseMoney(deal.revenue);
  const ebitdaCents = parseShowcaseMoney(deal.ebitda);
  const adjustedEbitdaCents = parseShowcaseMoney(deal.adjusted);
  const sectorKey = deal.sector as SectorImageKey;

  return {
    slug: `preview-${index + 1}`,
    codename: deal.codename,
    region: deal.region,
    revenueCents,
    ebitdaCents,
    adjustedEbitdaCents,
    hasAdjustments: adjustedEbitdaCents !== ebitdaCents,
    askingPriceCents: parseShowcaseMoney(deal.price),
    sectorKey,
    sector: deal.sector,
    sectorLabel: sectorLabel(deal.sector),
    headcount: extra.headcount,
    cnaeCode: extra.cnaeCode,
    cnaeTitle: extra.cnaeTitle,
    summary: extra.summary,
    financingChip: extra.financingChip,
  };
}

export const landingPreviewHref = "/lista-de-espera";
