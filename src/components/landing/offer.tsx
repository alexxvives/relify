import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, MapPin } from "lucide-react";
import { RoiChip, marginTone, sectorStyles } from "@/components/market-card";
import { landingCopy, offerDeals, type ShowcaseDeal } from "@/lib/landing-copy";

/** "110K €" → 110. The showcase figures share one unit, so ratios need no scaling. */
function thousands(value: string): number {
  return Number.parseFloat(value.replace(/[^\d,.]/g, "").replace(",", "."));
}

function share(part: string, whole: string): number | null {
  const ratio = thousands(part) / thousands(whole);
  return Number.isFinite(ratio) ? Math.round(ratio * 100) : null;
}

const sectorName = (sector: string) => sector.charAt(0).toUpperCase() + sector.slice(1);

/* First row: 1 / 2 / 3 / 4 cards by breakpoint. Literal classes so Tailwind sees them. */
const firstRow = ["", "hidden sm:block", "hidden lg:block", "hidden 2xl:block"] as const;

/** A sneak peek of the marketplace: one clear row, then the rest drifting by, locked behind the waitlist. */
export function Offer() {
  const copy = landingCopy.home.offer;
  const visible = offerDeals.slice(0, firstRow.length);
  const locked = offerDeals.slice(firstRow.length);

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[2rem] border border-[#dde7ea] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7f8_100%)] p-5 text-[#1c2740] shadow-[0_30px_80px_-50px_rgba(28,39,64,0.45)] sm:p-8 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(47,196,178,0.16),transparent_65%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#0f766e] uppercase">{copy.kicker}</p>
            <h2 id={`${copy.id}-titulo`} className="mt-3 text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
              {copy.heading}
            </h2>
            <p className="mt-4 max-w-[34rem] text-[16px] leading-7 text-[#3d4a63]">{copy.intro}</p>
          </div>
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-[#cfe6e3] bg-white px-3 py-1.5 text-xs font-medium tracking-wide text-[#3d4a63] shadow-sm lg:self-auto">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2fc4b2] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-[#0f766e]" />
            </span>
            {copy.preview}
          </p>
        </div>

        <ul className="relative mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((deal, index) => (
            <li key={deal.codename} className={`releva-peek-reveal ${firstRow[index]}`} style={{ ["--i" as string]: index }}>
              <PeekCard deal={deal} />
            </li>
          ))}
        </ul>

        {/* The rest of the market drifts by, blurred, under the waitlist ask. */}
        <div className="relative mt-5 -mx-5 sm:-mx-8 lg:-mx-12">
          <div aria-hidden className="releva-peek-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul className="releva-peek-track flex w-max gap-5 px-5 blur-[3px] sm:px-8 lg:px-12">
              {[...locked, ...locked].map((deal, index) => (
                <li key={`${deal.codename}-${index}`} className="w-[17.5rem] shrink-0 sm:w-[20rem]">
                  <PeekCard deal={deal} />
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f7f8]/30 via-[#f3f7f8]/85 to-[#f3f7f8] px-4 pt-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-sm ring-1 ring-[#cfe6e3]">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 max-w-md text-2xl font-medium tracking-tight sm:text-3xl">{copy.lockedTitle}</h3>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-[#3d4a63]">{copy.lockedBody}</p>
            <Link
              href={copy.waitlistHref}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.8)] transition-colors hover:bg-[#1c2740] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
            >
              {copy.lockedCta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Same anatomy as the marketplace MarketCard: photo, hanging sector badge, four figures, ROI chip. */
function PeekCard({ deal }: { deal: ShowcaseDeal }) {
  const style = sectorStyles[deal.sector];
  const Icon = style.icon;
  const years = thousands(deal.price) / thousands(deal.ebitda);
  const margin = share(deal.ebitda, deal.revenue);
  const adjustedMargin = share(deal.adjusted, deal.revenue);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e3e9ef] bg-white text-[#1c2740] shadow-[0_24px_48px_-30px_rgba(28,39,64,0.45)]">
      <div className="relative">
        <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#1c2a52]">
          <Image src={deal.image} alt="" fill className="object-cover" sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#0c1224]/45 via-transparent to-[#0c1224]/20" aria-hidden />
          <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-px text-[11px] font-medium shadow-sm backdrop-blur-sm">
            <MapPin className="size-3 text-[#5c6b78]" aria-hidden />
            {deal.region}
          </span>
        </div>
        <div
          className={`absolute bottom-0 left-4 z-[1] flex w-24 translate-y-1/2 flex-col items-center gap-1 rounded-2xl border-[3px] border-white px-1 pt-2.5 pb-2 shadow-[0_6px_16px_-8px_rgba(28,39,64,0.45)] ${style.tile}`}
        >
          <Icon className={`size-7 shrink-0 ${style.ink}`} strokeWidth={1.75} aria-hidden />
          <span className={`text-center text-[11px] leading-[13px] font-semibold ${style.ink}`}>{sectorName(deal.sector)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="mt-3 min-h-11 pl-[6.75rem]">
          <h3 className="truncate text-[17px] font-semibold tracking-tight">{deal.codename}</h3>
          <p className="truncate text-xs text-[#5c6b78]">
            {sectorName(deal.sector)} · {deal.region}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eceff4] bg-[#fafbfd]">
          <Figure label="Facturación" value={deal.revenue} />
          <Figure label="EBITDA" value={deal.ebitda} share={margin} className="border-l" />
          <Figure label="EBITDA ajustado" value={deal.adjusted} share={adjustedMargin} className="border-t" />
          <Figure
            label="Precio de venta"
            value={deal.price}
            className="border-t border-l"
            note={Number.isFinite(years) ? <RoiChip years={years} fit /> : null}
          />
        </dl>
      </div>
    </article>
  );
}

function Figure({
  label,
  value,
  share: part = null,
  className = "",
  note = null,
}: {
  label: string;
  value: string;
  share?: number | null;
  className?: string;
  note?: ReactNode;
}) {
  return (
    <div className={`@container flex min-w-0 flex-col items-center border-[#eceff4] px-2 py-2.5 text-center ${className}`}>
      <dt className="text-[11px] text-[#5c6b78]">{label}</dt>
      <dd className={`mt-0.5 flex flex-wrap items-center justify-center gap-1.5 tabular-nums text-[15px] font-semibold`}>
        {value}
        {part === null ? null : <span className={`text-xs font-semibold ${marginTone(part)}`}>{part} %</span>}
        {note}
      </dd>
    </div>
  );
}
