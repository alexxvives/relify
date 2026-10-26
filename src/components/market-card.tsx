import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
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
  type LucideIcon,
} from "lucide-react";
import { headcountLabels, isHeadcountRange } from "@/lib/company-profile";
import { formatCardEur, recoveryTone, recoveryYears } from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";
import { aiImageLabel, sectorImageSrc, type SectorImageKey } from "@/lib/sector-image";

type SectorStyle = { icon: LucideIcon; tile: string; ink: string; accent: string };

/** One icon and colour family per broad sector, so a buyer can scan the grid by industry. */
export const sectorStyles: Record<SectorImageKey, SectorStyle> = {
  hosteleria: { icon: UtensilsCrossed, tile: "bg-[#fff1e8]", ink: "text-[#b4541a]", accent: "bg-[#e07a3a]" },
  comercio: { icon: Store, tile: "bg-[#eef1fd]", ink: "text-[#3b4fc4]", accent: "bg-[#5c6ee6]" },
  industria: { icon: Factory, tile: "bg-[#eef2f6]", ink: "text-[#3d4f66]", accent: "bg-[#64788f]" },
  alimentacion: { icon: Wheat, tile: "bg-[#f6f4e3]", ink: "text-[#7a6a12]", accent: "bg-[#c2a422]" },
  construccion: { icon: HardHat, tile: "bg-[#fff6e0]", ink: "text-[#9a6200]", accent: "bg-[#e3a21a]" },
  servicios: { icon: Briefcase, tile: "bg-[#f1edfc]", ink: "text-[#5b3fb8]", accent: "bg-[#7c5ce0]" },
  transporte: { icon: Truck, tile: "bg-[#e8f4fb]", ink: "text-[#1d6a96]", accent: "bg-[#3a95c9]" },
  turismo: { icon: Palmtree, tile: "bg-[#e5f5f2]", ink: "text-[#11766b]", accent: "bg-[#1fa290]" },
  tecnologia: { icon: Cpu, tile: "bg-[#eaf0ff]", ink: "text-[#2f4fb0]", accent: "bg-[#4a6be0]" },
  salud: { icon: HeartPulse, tile: "bg-[#fdecef]", ink: "text-[#b0304a]", accent: "bg-[#d9506a]" },
  educacion: { icon: GraduationCap, tile: "bg-[#eef6e6]", ink: "text-[#4a7a1c]", accent: "bg-[#6fa53a]" },
  inmobiliaria: { icon: Building2, tile: "bg-[#f5efe8]", ink: "text-[#8a5a2b]", accent: "bg-[#b07a45]" },
};

const fallbackKey: SectorImageKey = "servicios";

const recoveryClass = {
  good: "text-[#17663a]",
  average: "text-[#b45f06]",
  high: "text-[#b42318]",
} as const;

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function percent(part: number, whole: number): number | null {
  if (whole <= 0) {
    return null;
  }
  return Math.round((part / whole) * 100);
}

/**
 * Marketplace listing card. Every company in a sector shares the same AI-generated sector photo
 * (labelled as such), so the banner says "what kind of business" at a glance without ever showing
 * the real premises. The CNAE line and the four figures carry the deal; the whole card links to
 * the ficha, and the optional `actions` (hide, favorite) sit on the photo above that link.
 */
export function MarketCard({ project, actions, muted = false }: { project: PublicProjectCard; actions?: ReactNode; muted?: boolean }) {
  const key = project.sectorKey ?? fallbackKey;
  const style = sectorStyles[key];
  const Icon = style.icon;
  const years = recoveryYears(project.askingPriceCents, project.ebitdaCents);
  const margin = percent(project.ebitdaCents, project.revenueCents);
  const adjustedMargin = percent(project.adjustedEbitdaCents, project.revenueCents);
  const headcount = project.headcount && isHeadcountRange(project.headcount) ? `${headcountLabels[project.headcount]} trab.` : null;
  const sectorName = project.sectorLabel ? sentence(project.sectorLabel) : null;
  const href = `/proyectos/${project.slug}`;

  return (
    <article
      className={`group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)] transition-[box-shadow,border-color,opacity] duration-200 focus-within:border-[#c9d1e0] hover:border-[#c9d1e0] hover:shadow-[0_18px_40px_-24px_rgba(28,39,64,0.5)] motion-reduce:transition-none ${muted ? "opacity-60" : ""}`}
    >
      <div className="relative aspect-[16/8] max-h-60 w-full overflow-hidden bg-[#1c2a52]">
        <Image
          src={sectorImageSrc(key)}
          alt=""
          fill
          sizes="(min-width: 2200px) 25vw, (min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03] motion-reduce:transition-none"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0c1224]/45 via-transparent to-[#0c1224]/25" aria-hidden />
        {project.verified ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#1b7a45] shadow-sm">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verificado
          </span>
        ) : null}
        <span
          className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-[#0c1224]/55 px-1.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm"
          title={aiImageLabel}
        >
          <Sparkles className="size-3" aria-hidden />
          IA<span className="sr-only">: {aiImageLabel}</span>
        </span>
      </div>
      {actions ? <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">{actions}</div> : null}

      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <span
          className={`relative z-10 -mt-7 flex size-14 items-center justify-center rounded-2xl border-4 border-white shadow-[0_6px_16px_-8px_rgba(28,39,64,0.45)] ${style.tile}`}
          aria-hidden
        >
          <Icon className={`size-6 ${style.ink}`} />
        </span>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-lg leading-6 font-semibold tracking-tight text-[#1c2740]">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:z-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-[#5c4de0]/35"
            >
              <span className="block truncate">{project.codename}</span>
            </Link>
          </h3>
          {sectorName ? (
            <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${style.tile} ${style.ink}`}>{sectorName}</span>
          ) : null}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#5c6b78]">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{project.region}</span>
          </span>
          {headcount ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 shrink-0" aria-hidden />
              {headcount}
            </span>
          ) : null}
          {project.foundedDecade ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              desde {project.foundedDecade}
            </span>
          ) : null}
        </p>

        {project.cnaeCode ? (
          <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#3d4a63]" title={project.cnaeTitle ? `CNAE ${project.cnaeCode} · ${project.cnaeTitle}` : undefined}>
            <span className="mr-1.5 rounded-md bg-[#f1f3f8] px-1.5 py-0.5 font-semibold text-[#1c2740] tabular-nums">CNAE {project.cnaeCode}</span>
            {project.cnaeTitle}
          </p>
        ) : null}
        {project.summary ? (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#5c6b78]">{project.summary}</p>
        ) : !project.cnaeCode ? (
          // Same height as a described card so the grid rows stay aligned.
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#8a96a3] italic">
            {sectorName ? `Empresa de ${sectorName.toLowerCase()}. ` : ""}El vendedor aún no ha añadido una descripción.
          </p>
        ) : null}

        <dl className="mt-4 mb-auto grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eceff4] bg-[#fafbfd]">
          <Figure label="Facturación" value={formatCardEur(project.revenueCents)} />
          <Figure label="EBITDA" value={formatCardEur(project.ebitdaCents)} share={margin} edge="left" />
          <Figure label="EBITDA ajustado" value={formatCardEur(project.adjustedEbitdaCents)} share={adjustedMargin} edge="top" />
          <Figure
            label="Precio de venta"
            value={formatCardEur(project.askingPriceCents)}
            edge="both"
            strong
            note={years === null ? null : <span className={recoveryClass[recoveryTone(years)]} title="Años para recuperar el precio de venta con el EBITDA">
                  Retorno ~{(Math.round(years * 10) / 10).toLocaleString("es-ES", { maximumFractionDigits: 1 })} años
                </span>}
          />
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
  share = null,
  edge,
  strong = false,
  note = null,
}: {
  label: string;
  value: string;
  share?: number | null;
  edge?: "left" | "top" | "both";
  strong?: boolean;
  note?: ReactNode;
}) {
  const border = edge === "left" ? "border-l" : edge === "top" ? "border-t" : edge === "both" ? "border-t border-l" : "";
  return (
    <div className={`min-w-0 border-[#eceff4] px-3.5 py-3 ${border}`}>
      <dt className="truncate text-xs text-[#667085]">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[#1c2740]">
        <span className={`${strong ? "text-lg" : "text-base"} leading-6 font-semibold whitespace-nowrap tabular-nums`}>{value}</span>
        {share !== null ? (
          <span className={`text-xs font-semibold whitespace-nowrap tabular-nums ${marginTone(share)}`} title={`Margen sobre facturación: ${share} %`}>
            {share} %<span className="sr-only"> de margen</span>
          </span>
        ) : null}
        {note ? <span className="w-full text-xs font-semibold tabular-nums">{note}</span> : null}
      </dd>
    </div>
  );
}
