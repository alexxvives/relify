import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Cpu,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  MapPin,
  Palmtree,
  Sparkles,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Wheat,
  type LucideIcon, HandCoins } from "lucide-react";
import { headcountLabels, isHeadcountRange } from "@/lib/company-profile";
import {
  formatCardEur,
  formatDecimal,
  recoveryTone,
  recoveryYears,
} from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";
import { companyCopy } from "@/lib/company-copy";
import {
  aiImageLabel,
  referencePhotoLabel,
  sectorImageSrc,
  type SectorImageKey,
} from "@/lib/sector-image";

/** Shared marketplace grid: as many ≥21rem columns as fit, so cards never get cramped at any width. */
/**
 * t93: column count from fixed px viewport breakpoints, so it only ever grows with width. The old auto-fill on 21rem
 * flipped 3→4→3 (and 4→5→4) because the root font size steps up at 1800px and 2300px, which makes 21rem wider.
 * Four columns hold until 2560px.
 */
export const marketGridClass =
  "grid grid-cols-1 gap-5 min-[768px]:grid-cols-2 min-[1360px]:grid-cols-3 min-[1760px]:grid-cols-4 min-[2560px]:grid-cols-5";

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

/**
 * "ROI 3,2 años": years for the EBITDA to pay back the asking price, as a chip beside the price.
 * `fit` lets the chip shorten to "ROI 3,2 a" (and "3,2 a" in very narrow cells) via the nearest
 * `@container`, so it never wraps under the price.
 */
export function RoiChip({
  years,
  fit = false,
}: {
  years: number;
  fit?: boolean;
}) {
  const value = formatDecimal(years);
  const title = `ROI: ${value} años para recuperar el precio de venta con el EBITDA`; // t95: tooltip carries the unit
  const tone = recoveryClass[recoveryTone(years)];
  if (!fit) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums ${tone}`}
        title={title}
      >
        ROI {value} años
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular-nums @[9.5rem]:px-2 @[9.5rem]:text-xs ${tone}`}
      title={title}
    >
      {/* t95: just "ROI 2,6"; the tooltip says it is the years to recover the price. */}
      ROI&nbsp;{value}
      <span className="sr-only"> años para recuperar el precio</span>
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
}) {
  const key = project.sectorKey ?? fallbackKey;
  const style = sectorStyles[key];
  const Icon = style.icon;
  const blocked = project.publishable === false;
  const years = blocked ? null : recoveryYears(project.askingPriceCents, project.ebitdaCents);
  // t73: 0 means "not known yet" on these cards (no SABI, no seller figure), never a real 0 €.
  const known = (cents: number | null | undefined): cents is number =>
    typeof cents === "number" && Number.isFinite(cents) && cents !== 0;
  const card = (cents: number | null | undefined): string | null =>
    known(cents) ? formatCardEur(cents) : null;
  const headcount =
    project.headcount && isHeadcountRange(project.headcount)
      ? `${headcountLabels[project.headcount]} trab.`
      : null;
  const sectorName = project.sectorLabel ? sentence(project.sectorLabel) : null;
  const href = hrefOverride ?? `/proyectos/${project.slug}`;
  const photoTags = [
    { key: "region", icon: MapPin, text: project.region },
    ...(headcount ? [{ key: "headcount", icon: Users, text: headcount }] : []),
  ];

  return (
    <article
      className={`group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)] transition-[box-shadow,border-color,opacity] duration-200 focus-within:border-[#c9d1e0] hover:border-[#c9d1e0] hover:shadow-[0_18px_40px_-24px_rgba(28,39,64,0.5)] motion-reduce:transition-none ${muted ? "opacity-60" : ""}`}
    >
      <div className="relative">
        <div className="relative aspect-[16/7] max-h-52 w-full overflow-hidden bg-[#1c2a52]">
          <Image
            src={sectorImageSrc(key)}
            alt=""
            fill
            sizes="(min-width: 2200px) 25vw, (min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03] motion-reduce:transition-none"
          />
          <span
            className="absolute inset-0 bg-gradient-to-t from-[#0c1224]/45 via-transparent to-[#0c1224]/25"
            aria-hidden
          />
          <div className="absolute top-2.5 left-2.5 flex max-w-[calc(100%-6rem)] flex-nowrap items-center gap-1 overflow-hidden">
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0c1224]/55 px-1.5 py-px text-[11px] font-medium text-white backdrop-blur-sm"
              title={aiImageLabel}
            >
              <Sparkles className="size-2.5" aria-hidden />
              {referencePhotoLabel}
              <span className="sr-only">. {aiImageLabel}</span>
            </span>
            {project.verified ? (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/95 px-1.5 py-px text-[11px] font-semibold text-[#1b7a45] shadow-sm">
                <BadgeCheck className="size-3 shrink-0" aria-hidden />
                <span className="truncate">Verificado</span>
              </span>
            ) : null}
          </div>
          {/* Location, size and age ride on the photo, so the body only carries the deal. */}
          {/* Two tags at most on one line, right of the sector badge; the rest fold into "+N". */}
          {hidePhotoTags ? null : (
            <ul className="absolute right-2.5 bottom-2.5 left-[7.25rem] flex flex-nowrap items-center justify-end gap-1 overflow-hidden">
              {photoTags.slice(0, 2).map((tag) => (
                <li
                  key={tag.key}
                  className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/90 px-1.5 py-px text-[11px] font-medium text-[#1c2740] shadow-sm backdrop-blur-sm"
                  title={tag.text}
                >
                  <tag.icon
                    className="size-3 shrink-0 text-[#5c6b78]"
                    aria-hidden
                  />
                  <span className="truncate">{tag.text}</span>
                </li>
              ))}
              {photoTags.length > 2 ? (
                <li
                  className="inline-flex shrink-0 items-center rounded-full bg-white/90 px-1.5 py-px text-[11px] font-semibold text-[#1c2740] shadow-sm backdrop-blur-sm"
                  title={photoTags
                    .slice(2)
                    .map((tag) => tag.text)
                    .join(" · ")}
                >
                  +{photoTags.length - 2}
                  <span className="sr-only">
                    :{" "}
                    {photoTags
                      .slice(2)
                      .map((tag) => tag.text)
                      .join(", ")}
                  </span>
                </li>
              ) : null}
            </ul>
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
        {/* t93: this row (right of the sector badge) holds only the financing chip; the CNAE code sits above the activity name. */}
        {/* t92: the seller-financing chip shares this row, so cards with and without it keep the same height. */}
        <div className="mt-3 flex min-h-8 min-w-0 flex-wrap items-start gap-1.5 pl-[6.75rem]">
          {project.financingChip ? (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-[#e6f4f2] px-1.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap text-[#0f766e]">
              <HandCoins className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{project.financingChip}</span>
            </span>
          ) : null}
        </div>
        {/* t91: the activity name on its own line, right above the description; one line, full name on hover. */}
        <div className="mt-2 flex h-6 items-center">
          {project.cnaeCode ? (
            <span className="rounded-md bg-[#f1f3f8] px-1.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">
              CNAE {project.cnaeCode}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 h-10 text-sm leading-5 font-medium text-[#1c2740]" title={project.cnaeTitle ?? undefined}>
          {project.cnaeTitle ?? ""}
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

        {/* t95: Facturación | EBITDA (adjusted underneath), then the price across both columns with its ROI pill. */}
        <dl className="mt-3 mb-auto grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eceff4] bg-[#fafbfd]">
          <Figure
            label="Facturación"
            value={card(project.revenueCents)}
          />
          <Figure
            label="EBITDA"
            value={card(project.ebitdaCents)}
            edge="left"
            extra={
              known(project.adjustedEbitdaCents) && project.adjustedEbitdaCents !== project.ebitdaCents ? (
                <span className="tabular-nums" title="EBITDA ajustado por el vendedor">
                  · {formatCardEur(project.adjustedEbitdaCents)}
                </span>
              ) : null
            }
          />
          <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#eceff4] px-4 py-3">
            <dt className="text-xs font-medium text-[#667085]">Precio de venta</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className={`text-lg leading-6 font-bold whitespace-nowrap tabular-nums ${!blocked && known(project.askingPriceCents) ? "text-[#1c2740]" : "text-[#8a96a3]"}`}>
                {blocked ? companyCopy.priceNotPublishable : (card(project.askingPriceCents) ?? priceUnset)}
              </span>
              {years === null ? null : <RoiChip years={years} fit />}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
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
  extra = null,
}: {
  label: string;
  /** Null when unknown: shows "—" with a "No disponible" tooltip instead of a fake 0. */
  value: string | null;
  edge?: "left" | "top" | "both";
  strong?: boolean;
  note?: ReactNode;
  /** Adjusted EBITDA, kept on the same line so the cell never grows a second row. */
  extra?: ReactNode;
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
      className={`@container min-w-0 border-[#eceff4] px-2.5 py-3 text-center ${border}`}
    >
      <dt className="truncate text-xs text-[#667085]">{label}</dt>
      <dd className="mt-0.5 flex min-w-0 items-baseline justify-center gap-x-1 text-[#1c2740]">
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
        {extra ? <span className="min-w-0 truncate text-[11px] leading-4 font-medium text-[#667085]">{extra}</span> : null}
        {note}
      </dd>
    </div>
  );
}
