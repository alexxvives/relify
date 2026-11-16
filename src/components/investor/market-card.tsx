import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Cpu,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  MapPin,
  Palmtree,
  Store,
  Truck,
  UtensilsCrossed,
  Wheat,
  HandCoins,
  type LucideIcon,
} from "lucide-react";
import { formatBasisPoints } from "@/lib/company-profile";
import { headlineEbitda, headlineEbitdaMargin, marginExplain, marginShortLabel } from "@/lib/financial-metrics";
import { formatCardEur, formatRoiPercent, roiPercent, roiTone } from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";
import { companyCopy } from "@/lib/company-copy";
import { sectorImageSrc, type SectorImageKey } from "@/lib/sector-image";

/** Shared marketplace grid: as many ≥21rem columns as fit, so cards never get cramped at any width. */
/**
 * t93: column count from fixed px viewport breakpoints, so it only ever grows with width. The old auto-fill on 21rem
 * flipped 3→4→3 (and 4→5→4) because the root font size steps up at 1800px and 2300px, which makes 21rem wider.
 * Four columns hold until 2560px.
 */
/**
 * Alex (S25): columns follow the content width, not the viewport, so the sidebar does not
 * cost a column. ~1024–1280 laptops get 3 cards, wide screens 4, very wide 5.
 * Wrap the grid in `marketGridFrameClass` (the query container).
 */
export const marketGridFrameClass = "@container/market";
export const marketGridClass =
  "grid grid-cols-1 gap-4 @[34rem]/market:grid-cols-2 @[44rem]/market:grid-cols-3 @[72rem]/market:grid-cols-4 @[100rem]/market:grid-cols-5";

type SectorStyle = {
  icon: LucideIcon;
  tile: string;
  ink: string;
  accent: string;
};

/** One icon and colour family per broad sector, so a buyer can scan the grid by industry. */
export const sectorStyles: Record<SectorImageKey, SectorStyle> = {
  hosteleria: {
    icon: UtensilsCrossed,
    tile: "bg-[#fff1e8]",
    ink: "text-[#b4541a]",
    accent: "bg-[#e07a3a]",
  },
  comercio: {
    icon: Store,
    tile: "bg-[#eef1fd]",
    ink: "text-[#3b4fc4]",
    accent: "bg-[#5c6ee6]",
  },
  industria: {
    icon: Factory,
    tile: "bg-[#eef2f6]",
    ink: "text-[#3d4f66]",
    accent: "bg-[#64788f]",
  },
  alimentacion: {
    icon: Wheat,
    tile: "bg-[#f6f4e3]",
    ink: "text-[#7a6a12]",
    accent: "bg-[#c2a422]",
  },
  construccion: {
    icon: HardHat,
    tile: "bg-[#fff6e0]",
    ink: "text-[#9a6200]",
    accent: "bg-[#e3a21a]",
  },
  servicios: {
    icon: Briefcase,
    tile: "bg-[#f1edfc]",
    ink: "text-[#5b3fb8]",
    accent: "bg-[#7c5ce0]",
  },
  transporte: {
    icon: Truck,
    tile: "bg-[#e8f4fb]",
    ink: "text-[#1d6a96]",
    accent: "bg-[#3a95c9]",
  },
  turismo: {
    icon: Palmtree,
    tile: "bg-[#e5f5f2]",
    ink: "text-[#11766b]",
    accent: "bg-[#1fa290]",
  },
  tecnologia: {
    icon: Cpu,
    tile: "bg-[#eaf0ff]",
    ink: "text-[#2f4fb0]",
    accent: "bg-[#4a6be0]",
  },
  salud: {
    icon: HeartPulse,
    tile: "bg-[#fdecef]",
    ink: "text-[#b0304a]",
    accent: "bg-[#d9506a]",
  },
  educacion: {
    icon: GraduationCap,
    tile: "bg-[#eef6e6]",
    ink: "text-[#4a7a1c]",
    accent: "bg-[#6fa53a]",
  },
  inmobiliaria: {
    icon: Building2,
    tile: "bg-[#f5efe8]",
    ink: "text-[#8a5a2b]",
    accent: "bg-[#b07a45]",
  },
};

const fallbackKey: SectorImageKey = "servicios";

const recoveryClass = {
  good: "bg-[#e7f6ee] text-[#17663a]",
  average: "bg-[#fdf1e3] text-[#b45f06]",
  high: "bg-[#fdecec] text-[#b42318]",
} as const;

/** S27: "ROI 25%": yearly EBITDA over the asking price (EBITDA / precio × 100), as a chip beside the price. */
export function RoiChip({
  roi,
  fit = false,
}: {
  roi: number;
  fit?: boolean;
}) {
  const value = formatRoiPercent(roi);
  const title = `ROI: ${value} anual (EBITDA / precio de venta)`;
  const tone = recoveryClass[roiTone(roi)];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap tabular-nums ${tone} ${fit ? "px-1.5 py-0.5 text-[11px] @[9.5rem]:px-2 @[9.5rem]:text-xs" : "px-2 py-0.5 text-xs"}`}
      title={title}
    >
      ROI {value}
    </span>
  );
}

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Marketplace listing card. Every company in a sector shares the same AI-generated sector photo
 * (labelled as such), so the banner says "what kind of business" at a glance without ever showing
 * the real premises. The CNAE line and the four figures carry the deal; the whole card links to
 * the ficha, and the optional `actions` (hide, favorite) sit on the photo above that link.
 */
export function MarketCard({
  project,
  actions,
  muted = false,
  href: hrefOverride,
  hidePhotoTags = false,
  priceUnset = "A consultar",
  coverOverlay = null,
  hideCoverPhoto = false,
}: {
  project: PublicProjectCard;
  actions?: ReactNode;
  muted?: boolean;
  /** Admin reuses the card but links to its own company page. */
  href?: string;
  /** Admin grid drops the location/size/age chips on the photo. */
  hidePhotoTags?: boolean;
  /** t83: shown when there is no asking price ("A consultar" for buyers, "Sin definir" in the seller preview). */
  priceUnset?: string;
  /** Landing process ficha: name-redact overlay on the photo. The white body stays this card. */
  coverOverlay?: ReactNode;
  /** Landing process: keep the blue wash, drop the sector photo. */
  hideCoverPhoto?: boolean;
}) {
  const key = project.sectorKey ?? fallbackKey;
  const style = sectorStyles[key];
  const Icon = style.icon;
  const blocked = project.publishable === false;
  // t73: 0 means "not known yet" on these cards (no SABI, no seller figure), never a real 0 €.
  const known = (cents: number | null | undefined): cents is number =>
    typeof cents === "number" && Number.isFinite(cents) && cents !== 0;
  const card = (cents: number | null | undefined): string | null =>
    known(cents) ? formatCardEur(cents) : null;
  // Approved adjustments: the tile is EBITDA aj. Pending-only keeps the accounts figure.
  const adjustedKnown = project.hasAdjustments === true
    || (project.hasAdjustments === undefined && known(project.adjustedEbitdaCents) && project.adjustedEbitdaCents !== project.ebitdaCents);
  const ebitda = headlineEbitda({
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    hasApprovedAdjustments: adjustedKnown,
    hasPendingAdjustments: project.hasPendingAdjustments === true,
  });
  const profitCents = ebitda.primaryCents;
  const roi = blocked ? null : roiPercent(project.askingPriceCents, profitCents);
  const sectorName = project.sectorLabel ? sentence(project.sectorLabel) : null;
  const href = hrefOverride ?? `/proyectos/${project.slug}`;

  return (
    <article
      className={`group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)] transition-[box-shadow,border-color,opacity] duration-200 focus-within:border-[#c9d1e0] hover:border-[#c9d1e0] hover:shadow-[0_18px_40px_-24px_rgba(28,39,64,0.5)] motion-reduce:transition-none ${muted ? "opacity-60" : ""}`}
    >
      <div className="@container/cover relative">
        <div className="relative aspect-[16/7] max-h-52 w-full overflow-hidden bg-[#1c2a52]">
          {hideCoverPhoto ? null : (
            <Image
              src={sectorImageSrc(key)}
              alt=""
              fill
              sizes="(min-width: 2200px) 25vw, (min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03] motion-reduce:transition-none"
            />
          )}
          <span
            className={`absolute inset-0 ${hideCoverPhoto ? "bg-gradient-to-t from-[#0c1224]/35 via-[#1c2a52]/20 to-[#24356a]/35" : "bg-gradient-to-t from-[#0c1224]/45 via-transparent to-[#0c1224]/25"}`}
            aria-hidden
          />
          {coverOverlay ? (
            <div className="releva-ficha-cover-overlay" aria-hidden>
              {coverOverlay}
            </div>
          ) : null}
          <div className="absolute top-2.5 left-2.5 flex max-w-[calc(100%-6rem)] flex-nowrap items-center gap-1 overflow-hidden">
            {project.financingChip ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e6f4f2]/95 px-1.5 py-px text-[11px] font-semibold text-[#0f766e] shadow-sm backdrop-blur-sm">
                <HandCoins className="size-2.5 shrink-0" aria-hidden />
                <span className="truncate">{project.financingChip}</span>
              </span>
            ) : null}
          </div>
          {/* S26: the photo carries only the location (no headcount, no Verificado), so it never truncates. */}
          {hidePhotoTags || !project.region ? null : (
            <p className="absolute right-2.5 bottom-2.5 left-[7.25rem] flex justify-end overflow-hidden">
              <span
                className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/90 px-1.5 py-px text-[11px] font-medium text-[#1c2740] shadow-sm backdrop-blur-sm"
                title={project.region}
              >
                <MapPin className="size-3 shrink-0 text-[#5c6b78]" aria-hidden />
                <span className="truncate">{project.region}</span>
              </span>
            </p>
          )}
        </div>
        {/* Sector badge straddles the photo's bottom edge, bottom-left. */}
        <div
          className={`pointer-events-none absolute bottom-0 left-4 z-[6] flex w-24 translate-y-1/2 flex-col items-center gap-1 rounded-2xl border-[3px] border-white px-1 pt-2.5 pb-2 shadow-[0_6px_16px_-8px_rgba(28,39,64,0.45)] ${style.tile}`}
          title={sectorName ?? undefined}
        >
          <Icon
            className={`size-7 shrink-0 ${style.ink}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span
            lang="es"
            className={`line-clamp-2 w-full text-center text-[11px] leading-[13px] font-semibold [overflow-wrap:normal] hyphens-auto ${style.ink}`}
          >
            {sectorName ?? "Empresa"}
          </span>
        </div>
      </div>
      {/* Direct child of the article, so the stretched link covers the photo as well as the body. */}
      <h3 className="m-0 h-0">
        <Link
          href={href}
          className="outline-none after:absolute after:inset-0 after:z-[5] after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-[#5c4de0]/35"
        >
          <span className="sr-only">
            {sectorName
              ? `Empresa de ${sectorName.toLowerCase()} en ${project.region}`
              : `Empresa en ${project.region}`}
          </span>
        </Link>
      </h3>
      {actions ? (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {actions}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="mt-3 min-h-8" aria-hidden />
        {/* t91: the activity name on its own line, right above the description; one line, full name on hover. */}
        <div className="mt-2 flex h-6 items-center">
          {project.cnaeCode ? (
            <span className="rounded-md bg-[#f1f3f8] px-1.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">
              CNAE {project.cnaeCode}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 h-10 text-sm leading-5 font-medium text-[#1c2740]" title={project.cnaeTitle || sectorName || undefined}>
          {project.cnaeTitle || sectorName || ""}
        </p>
        {/* t73: the description block always takes exactly two lines, so every card in a row has the same height. */}
        <p
          className={`mt-2 line-clamp-2 h-10 text-sm leading-5 ${project.summary ? "text-[#5c6b78]" : "text-[#8a96a3] italic"}`}
          title={project.summary || undefined}
        >
          {project.summary
            ? project.summary
            : `${sectorName && !project.cnaeCode ? `Empresa de ${sectorName.toLowerCase()}. ` : ""}El vendedor aún no ha añadido una descripción.`}
        </p>

        {/* Facturación | EBITDA (ajustado when the seller added one), then the price under its label. */}
        <dl className="mt-3 mb-auto grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eceff4] bg-[#fafbfd]">
          <Figure
            label="Facturación"
            value={card(project.revenueCents)}
          />
          <Figure
            label={ebitda.primaryLabel}
            value={card(profitCents)}
            edge="left"
            ink={adjustedKnown && project.adjustedEbitdaCents < 0 ? "text-[#b42318]" : undefined}
            hint={ebitdaHint(project, ebitda)}
            note={ebitdaMarginNote(project, ebitda)}
          />
          <div className="col-span-2 flex flex-col items-center gap-1 border-t border-[#eceff4] px-4 py-3 text-center">
            <dt className="text-xs font-medium text-[#667085]">Precio de venta</dt>
            <dd className="flex min-w-0 items-center justify-center gap-2">
              <span className={`text-lg leading-6 font-bold whitespace-nowrap tabular-nums ${!blocked && known(project.askingPriceCents) ? "text-[#1c2740]" : "text-[#8a96a3]"}`}>
                {blocked ? companyCopy.priceNotPublishable : (card(project.askingPriceCents) ?? priceUnset)}
              </span>
              {roi === null ? null : <RoiChip roi={roi} fit />}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function ebitdaHint(project: PublicProjectCard, ebitda: ReturnType<typeof headlineEbitda>): string | undefined {
  const headline = headlineEbitdaMargin({
    revenueCents: project.revenueCents,
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    hasAdjustments: ebitda.primaryLabel === "EBITDA aj.",
  });
  const reported =
    headline.secondaryBp === null || headline.secondaryLabel === null
      ? null
      : `${headline.secondaryLabel}: ${formatBasisPoints(headline.secondaryBp)}.`;
  if (ebitda.pendingReview) {
    return `${companyCopy.adjustmentInReview}. Hasta que Relify acepte el ajuste, el comprador ve el EBITDA de las cuentas.`;
  }
  if (ebitda.secondaryCents !== null && knownCents(ebitda.secondaryCents)) {
    return [`EBITDA ajustado por el vendedor. ${ebitda.secondaryLabel}: ${formatCardEur(ebitda.secondaryCents)}.`, reported].filter(Boolean).join(" ");
  }
  if (ebitda.primaryLabel === "EBITDA aj.") {
    return ["EBITDA ajustado por el vendedor.", reported].filter(Boolean).join(" ");
  }
  return undefined;
}

function ebitdaMarginNote(project: PublicProjectCard, ebitda: ReturnType<typeof headlineEbitda>): ReactNode {
  const headline = headlineEbitdaMargin({
    revenueCents: project.revenueCents,
    ebitdaCents: project.ebitdaCents,
    adjustedEbitdaCents: project.adjustedEbitdaCents,
    hasAdjustments: ebitda.primaryLabel === "EBITDA aj.",
  });
  if (headline.primaryBp === null) {
    return null;
  }
  return (
    <span
      className={`text-[11px] font-medium whitespace-nowrap ${marginTone(headline.primaryBp / 100)}`}
      title={[marginExplain(headline.primaryLabel, formatBasisPoints(headline.primaryBp)), ebitdaHint(project, ebitda)].filter(Boolean).join(" ")}
    >
      {/* S28 (Alex): "margen 12 %" (EBITDA / facturación), not a bare % that reads like growth. */}
      {marginShortLabel(headline.primaryLabel).toLowerCase()} {formatBasisPoints(headline.primaryBp)}
    </span>
  );
}

function knownCents(cents: number | null | undefined): cents is number {
  return typeof cents === "number" && Number.isFinite(cents) && cents !== 0;
}

export function marginTone(share: number): string {
  // ≥15 % healthy, 5–15 % middling, <5 % thin or negative.
  if (share >= 15) return "text-[#17663a]";
  if (share >= 5) return "text-[#b45f06]";
  return "text-[#b42318]";
}

function Figure({
  label,
  value,
  edge,
  strong = false,
  note = null,
  ink = "text-[#1c2740]",
  hint,
}: {
  label: string;
  /** Null when unknown: shows "—" with a "No disponible" tooltip instead of a fake 0. */
  value: string | null;
  edge?: "left" | "top" | "both";
  strong?: boolean;
  note?: ReactNode;
  ink?: string;
  hint?: string;
}) {
  const border =
    edge === "left"
      ? "border-l"
      : edge === "top"
        ? "border-t"
        : edge === "both"
          ? "border-t border-l"
          : "";
  return (
    <div
      title={hint}
      className={`@container min-w-0 border-[#eceff4] px-2.5 py-3 text-center ${border}`}
    >
      <dt className="truncate text-xs text-[#667085]">{label}</dt>
      <dd className={`mt-0.5 flex min-w-0 items-baseline justify-center gap-x-1 ${ink}`}>
        <span
          className={`${strong ? "text-base @[9.5rem]:text-lg" : "text-base"} shrink-0 leading-6 font-semibold whitespace-nowrap tabular-nums`}
        >
          {value === null ? (
            <span className="text-[#9aa5b1]" title="No disponible">
              —<span className="sr-only">No disponible</span>
            </span>
          ) : (
            value
          )}
        </span>
        {note}
      </dd>
    </div>
  );
}
