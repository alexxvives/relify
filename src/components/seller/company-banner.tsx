import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { sectorStyles } from "@/components/investor/market-card";
import type { SectorImageKey } from "@/lib/sector-image";
import { sectorBannerBackground, sectorThemes } from "@/lib/sector-theme";

export function CompanyBanner({
  title,
  subtitle,
  status,
  statusNote = null,
  progress,
  children,
  cue,
  heading = "h1",
  sector = null,
  chips = [],
  variant = "hero",
}: {
  title: string;
  subtitle?: string;
  status?: { label: string; live: boolean };
  /** t76: small chip next to the status (admin publish readiness). */
  statusNote?: ReactNode;
  progress?: ReactNode;
  children?: ReactNode;
  /** Deal "what's next" cue, shown under the progress bar. */
  cue?: ReactNode;
  heading?: "h1" | "p";
  /** t83: CNAE sector family: the banner uses the sector icon and hue. t88: never a photo (photos live in the Fotos section). */
  sector?: SectorImageKey | null;
  /** t83: neutral chips under the title (sector, region, founding decade). Never identifying data. */
  chips?: string[];
  /**
   * t88b: "compact" is the admin company header (t81: no hero banner). Same data and slots as the hero: a small
   * sector tile, the name, small chips, status, readiness chip, then deal progress and cue on the light page.
   */
  variant?: "hero" | "compact";
}) {
  const Title = heading;
  if (variant === "compact") {
    const Icon = sector ? sectorStyles[sector].icon : null;
    return (
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {sector && Icon ? (
            <span
              className="flex size-9 items-center justify-center rounded-xl text-white"
              style={{ background: sectorThemes[sector].hue }}
              title={sectorThemes[sector].label}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
          ) : null}
          <Title className="text-2xl font-semibold text-[#1c2740]">{title}</Title>
          {chips.length > 0
            ? chips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-xs font-medium text-[#3d4a63]">
                  {chip}
                </span>
              ))
            : subtitle ? <span className="text-sm text-[#5c6b78]">{subtitle}</span> : null}
          {status ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1e5eb] bg-white px-2.5 py-1 text-xs font-medium text-[#3d4a63]">
              <span className={`size-2 rounded-full ${status.live ? "bg-[#2fc4b2]" : "bg-[#c3c9d3]"}`} aria-hidden />
              {status.label}
            </span>
          ) : null}
          {statusNote}
          {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
        </div>
        {progress ? <div>{progress}</div> : null}
        {cue ? <div className="flex">{cue}</div> : null}
      </header>
    );
  }
  const themed = sector !== null;
  const SectorIcon = sector ? sectorStyles[sector].icon : null;

  return (
    <header
      className="relative overflow-hidden rounded-[1.75rem] px-6 py-8 text-white sm:px-8 sm:py-10"
      style={
        themed && sector
          ? { background: sectorBannerBackground(sector) }
          : { background: "linear-gradient(135deg, #1c2740 0%, #141c30 100%)" }
      }
    >
      <div
        className="pointer-events-none absolute -inset-4 opacity-20"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      {themed && SectorIcon ? (
        <SectorIcon
          className="pointer-events-none absolute -right-10 -bottom-16 size-72 rotate-[-12deg] text-white opacity-[0.08] sm:size-96"
          strokeWidth={1.25}
          aria-hidden
        />
      ) : null}
      {children ? <div className="absolute top-5 right-5 z-10 flex items-center gap-2">{children}</div> : null}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {themed && SectorIcon ? (
          <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/25" aria-hidden>
            <SectorIcon className="size-5 text-white" />
          </span>
        ) : null}
        <Title className="releva-page-title text-5xl leading-[0.96] text-white sm:text-6xl">
          {title}
        </Title>
        {chips.length > 0 ? (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Datos generales">
            {chips.map((chip) => (
              <li key={chip} className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 sm:text-sm">
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
        {subtitle || status ? (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#e7ecff]">
          {subtitle ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {subtitle}
          </span>
          ) : null}
          {status ? (
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex size-2.5" aria-hidden>
                <span
                  className={
                    status.live
                      ? "releva-live-dot absolute inset-0 rounded-full bg-[#5dffa8]"
                      : "releva-live-dot absolute inset-0 rounded-full bg-[#ffd27a]"
                  }
                />
                <span
                  className={
                    status.live
                      ? "relative inline-flex size-2.5 rounded-full bg-[#5dffa8]"
                      : "relative inline-flex size-2.5 rounded-full bg-[#ffd27a]"
                  }
                />
              </span>
              {status.label}
            </span>
          ) : null}
          {statusNote}
        </p>
        ) : null}
      </div>
      {progress ? <div className="relative z-10 mt-8 sm:mt-10">{progress}</div> : null}
      {cue ? <div className={`relative z-10 mx-auto flex max-w-xl justify-center text-left ${progress ? "mt-6" : "mt-8"}`}>{cue}</div> : null}
    </header>
  );
}
