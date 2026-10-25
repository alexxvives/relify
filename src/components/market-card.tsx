import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Factory,
  HardHat,
  MapPin,
  Palmtree,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { headcountLabels, isHeadcountRange } from "@/lib/company-profile";
import { formatCardEur, formatWholeEur, recoveryTone, recoveryYears } from "@/lib/money";
import { projectImageSrc } from "@/lib/project-image";
import type { PublicProjectCard } from "@/lib/public-project";
import type { SectorImageKey } from "@/lib/sector-image";

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
};

const fallbackStyle = sectorStyles.servicios;

const tone = {
  good: { text: "text-[#17663a]", dot: "bg-[#1b7a45]", label: "Plazo corto" },
  average: { text: "text-[#9a5a00]", dot: "bg-[#d98a10]", label: "Plazo habitual" },
  high: { text: "text-[#b42318]", dot: "bg-[#d0362c]", label: "Plazo largo" },
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
 * Marketplace listing card. Leads with the deal (price, payback, margins) and the industry,
 * not the photo: only the company's own picture is shown, as a small thumbnail; otherwise the
 * sector tile stands in, so no AI picture needs labelling here.
 */
export function MarketCard({ project, action }: { project: PublicProjectCard; action?: ReactNode }) {
  const style = project.sectorKey ? sectorStyles[project.sectorKey] : fallbackStyle;
  const Icon = style.icon;
  const own = project.coverSrc && project.coverSrc.length > 0 ? project.coverSrc : projectImageSrc(project.slug);
  const years = recoveryYears(project.askingPriceCents, project.ebitdaCents);
  const yearsTone = years === null ? null : tone[recoveryTone(years)];
  const margin = percent(project.ebitdaCents, project.revenueCents);
  const adjustedMargin = percent(project.adjustedEbitdaCents, project.revenueCents);
  const headcount = project.headcount && isHeadcountRange(project.headcount) ? `${headcountLabels[project.headcount]} trab.` : null;
  const sectorName = project.sectorLabel ? sentence(project.sectorLabel) : null;
  const yearsLabel = years === null ? null : (Math.round(years * 10) / 10).toLocaleString("es-ES", { maximumFractionDigits: 1 });

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white shadow-[0_1px_2px_rgba(28,39,64,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-[#cfd6e2] hover:shadow-[0_16px_36px_-22px_rgba(28,39,64,0.45)]">
      <span className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} aria-hidden />
      {action ? <div className="absolute top-4 right-4 z-10">{action}</div> : null}
      <Link
        href={`/proyectos/${project.slug}`}
        className="flex h-full flex-col gap-4 p-5 pt-6 outline-none focus-visible:ring-3 focus-visible:ring-[#5c4de0]/30"
      >
        <div className="flex items-start gap-3.5 pr-12">
          <span className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${style.tile}`}>
            {own ? (
              own.includes("/portadas/") ? (
                // The cover is served by the app route, not a static file next/image can import.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={own} alt="" className="size-full object-cover" />
              ) : (
                <Image src={own} alt="" fill sizes="56px" className="object-cover" />
              )
            ) : (
              <Icon className={`size-7 ${style.ink}`} aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-6 font-semibold tracking-tight text-[#1c2740]">{project.codename}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-[#5c6b78]">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{project.region}</span>
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="Datos de la empresa">
          {sectorName ? (
            <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.tile} ${style.ink}`}>
              <Icon className="size-3.5" aria-hidden />
              {sectorName}
            </li>
          ) : null}
          {project.verified ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-[#e7f6ee] px-2.5 py-1 text-xs font-semibold text-[#1b7a45]">
              <BadgeCheck className="size-3.5" aria-hidden />
              Verificado
            </li>
          ) : null}
          {headcount ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-[#f4f6fb] px-2.5 py-1 text-xs font-medium text-[#3d4a63]">
              <Users className="size-3.5" aria-hidden />
              {headcount}
            </li>
          ) : null}
          {project.foundedDecade ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-[#f4f6fb] px-2.5 py-1 text-xs font-medium text-[#3d4a63]">
              <CalendarDays className="size-3.5" aria-hidden />
              desde {project.foundedDecade}
            </li>
          ) : null}
        </ul>

        <div className="rounded-xl bg-[#f6f8fc] p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#667085]">Precio de venta</p>
              <p className="mt-0.5 text-2xl leading-8 font-semibold tracking-tight whitespace-nowrap text-[#1c2740] tabular-nums">
                {formatWholeEur(project.askingPriceCents)}
              </p>
            </div>
            {years !== null && yearsTone ? (
              <div className="shrink-0 text-right" title="Años para recuperar el precio de venta con el EBITDA.">
                <p className="text-xs font-medium text-[#667085]">Recuperas en</p>
                <p className={`mt-0.5 text-lg leading-8 font-semibold whitespace-nowrap tabular-nums ${yearsTone.text}`}>~{yearsLabel} años</p>
              </div>
            ) : null}
          </div>
          {years !== null && yearsTone ? (
            <div className="mt-3">
              <div className="relative h-3" aria-hidden>
                <span className="absolute inset-x-0 top-[3px] h-1.5 rounded-full bg-[linear-gradient(90deg,#1b7a45_0%,#1b7a45_40%,#d98a10_40%,#d98a10_70%,#d0362c_70%,#d0362c_100%)] opacity-25" />
                <span
                  className={`absolute top-0 block size-3 -translate-x-1/2 rounded-full ring-2 ring-white ${yearsTone.dot}`}
                  style={{ left: `${Math.max(3, Math.min(years, 10) * 10)}%` }}
                />
              </div>
              <p className={`mt-2 text-xs font-medium ${yearsTone.text}`}>{yearsTone.label} · escala de 0 a 10 años</p>
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <Figure label="Facturación" value={formatCardEur(project.revenueCents)} />
          <Figure label="EBITDA" value={formatCardEur(project.ebitdaCents)} share={margin} accent={style.accent} />
          <Figure label="EBITDA aj." value={formatCardEur(project.adjustedEbitdaCents)} share={adjustedMargin} accent={style.accent} />
        </dl>

        <span className="mt-auto flex items-center justify-end gap-1 text-sm font-semibold text-[#465ab4] group-hover:text-[#33429a]">
          Ver empresa
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
        </span>
      </Link>
    </article>
  );
}

function Figure({ label, value, share = null, accent }: { label: string; value: string; share?: number | null; accent?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eef0f4] px-2.5 py-2">
      <dt className="truncate text-xs text-[#667085]">{label}</dt>
      <dd className="mt-0.5 text-base leading-6 font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">{value}</dd>
      {share !== null && accent ? (
        <dd className="mt-1.5 flex items-center gap-1.5" title={`Margen sobre facturación: ${share} %`}>
          <span className="block h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef0f4]">
            <span className={`block h-full rounded-full ${accent}`} style={{ width: `${Math.max(4, Math.min(share, 100))}%` }} />
          </span>
          <span className="shrink-0 text-xs text-[#667085] tabular-nums">
            {share} %<span className="sr-only"> de margen</span>
          </span>
        </dd>
      ) : (
        <dd className="mt-1.5 text-xs text-[#667085]">Ventas anuales</dd>
      )}
    </div>
  );
}
