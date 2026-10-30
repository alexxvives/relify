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

/*
 * Two rows per breakpoint (1 / 2 / 3 / 4 columns): the first row reads clearly, the second sits
 * blurred under the fade, and anything past it is not rendered at that width. Literal classes so
 * Tailwind sees them.
 */
const slots = [
  "",
  "blur-[3px] sm:blur-none",
  "hidden sm:block sm:blur-[3px] lg:blur-none",
  "hidden sm:block sm:blur-[3px] lg:blur-[3px] 2xl:blur-none",
  "hidden lg:block lg:blur-[3px]",
  "hidden lg:block lg:blur-[3px]",
  "hidden 2xl:block 2xl:blur-[3px]",
  "hidden 2xl:block 2xl:blur-[3px]",
] as const;

/** A sneak peek of the marketplace: real-looking cards, the second row locked behind the waitlist. */
export function Offer() {
  const copy = landingCopy.home.offer;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[2rem] bg-public-ink p-5 text-white sm:p-8 lg:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <p className="text-sm tracking-[0.16em] text-[#7fd6cc] uppercase">{copy.kicker}</p>
            <h2 id={`${copy.id}-titulo`} className="mt-3 text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
              {copy.heading}
            </h2>
            <p className="mt-4 max-w-[34rem] text-[16px] leading-7 text-white/70">{copy.intro}</p>
          </div>
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-white/75 lg:self-auto">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7fd6cc] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-[#7fd6cc]" />
            </span>
            {copy.preview}
          </p>
        </div>

        <div className="relative mt-10">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {offerDeals.slice(0, slots.length).map((deal, index) => (
              <li key={deal.codename} className={slots[index]} aria-hidden={index > 0 ? true : undefined}>
                <PeekCard deal={deal} />
              </li>
            ))}
          </ul>

          {/* Fade over the second row, with the waitlist ask on top. */}
          <div className="absolute inset-x-0 top-1/2 bottom-0 flex flex-col items-center justify-center bg-gradient-to-b from-public-ink/40 via-public-ink/85 to-public-ink px-4 pt-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-[#7fd6cc] ring-1 ring-white/15 backdrop-blur-sm">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 max-w-md text-2xl font-medium tracking-tight sm:text-3xl">{copy.lockedTitle}</h3>
            <p className="mt-2 max-w-md text-[15px] leading-6 text-white/70">{copy.lockedBody}</p>
            <Link
              href={copy.waitlistHref}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[#7fd6cc] px-6 text-sm font-semibold text-public-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd6cc]"
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
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-[#1c2740] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.6)]">
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
