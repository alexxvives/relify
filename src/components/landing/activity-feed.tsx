import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarCheck,
  Factory,
  Handshake,
  Hotel,
  Store,
  Truck,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { activityItems, landingCopy, showcaseSectorLabels, type ShowcaseSector } from "@/lib/landing-copy";

const kindIcon: Record<(typeof activityItems)[number]["kind"], LucideIcon> = {
  accepted: Handshake,
  interest: Bell,
  meeting: CalendarCheck,
  mandate: Briefcase,
};

const sectorIcon: Record<ShowcaseSector, LucideIcon> = {
  industria: Factory,
  comercio: Store,
  servicios: Briefcase,
  transporte: Truck,
  alimentacion: Wheat,
  hosteleria: UtensilsCrossed,
  construccion: Factory,
  turismo: Hotel,
};

function Spark({ values }: { values: readonly number[] }) {
  const peak = Math.max(...values, 1);
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values
    .map((value, index) => `${(index * step).toFixed(1)},${(100 - (value / peak) * 100).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-10 w-20 shrink-0 text-public-clay" aria-hidden="true" preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

export function ActivityFeed() {
  const loop = [...activityItems, ...activityItems];
  const copy = landingCopy.activity;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-24 px-5 py-6 sm:px-8 sm:py-12">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[24px] bg-public-moss px-5 py-8 text-white sm:rounded-[32px] sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
          <div className="absolute -top-20 -left-16 h-72 w-80 rotate-12 rounded-[48px] bg-public-clay" />
          <div className="absolute top-28 -left-10 h-44 w-[28rem] -rotate-6 rounded-[40px] bg-public-ink/80" />
          <div className="absolute right-[38%] -bottom-16 h-56 w-64 rotate-6 rounded-[42px] bg-[#14998a]/90" />
          <div className="absolute top-10 right-[42%] h-24 w-40 -rotate-12 rounded-[28px] bg-public-clay/70" />
        </div>
        <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div>
            <p className="text-sm tracking-[0.16em] text-white/75 uppercase">{copy.kicker}</p>
            <h2
              id={`${copy.id}-titulo`}
              className="releva-section-title mt-2 text-white sm:mt-3"
            >
              {copy.heading}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80 sm:mt-3 sm:text-[16px] sm:leading-7">{copy.intro}</p>
            <Link
              href={copy.ctaHref}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-public-ink sm:w-auto"
            >
              {copy.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="releva-mask-y h-[240px] overflow-hidden sm:h-[440px]">
            <div className="releva-reel-down flex flex-col gap-3">
              {loop.map((item, index) => {
                const KindIcon = kindIcon[item.kind];
                const SectorIcon = sectorIcon[item.sector];
                return (
                  <article key={`${item.to}-${index}`} className="rounded-2xl bg-white p-4 text-public-ink shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs text-public-muted">
                          <KindIcon className="size-3.5 shrink-0 text-public-clay" aria-hidden />
                          {item.time}
                        </p>
                        <h3 className="mt-1 font-medium">{item.title}</h3>
                        <p className="text-sm text-public-muted">{item.body}</p>
                      </div>
                      <span className="text-public-clay">
                        <Spark values={item.spark} />
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                      <span className="inline-flex items-center gap-1 rounded-full bg-public-sand px-2 py-1">
                        <SectorIcon className="size-3" aria-hidden />
                        {showcaseSectorLabels[item.sector]}
                      </span>
                      <span className="rounded-full bg-[#eef6f4] px-2 py-1 tabular-nums text-[#0f6b62]">
                        {item.revenue}
                      </span>
                      <span className="rounded-full bg-[#eef6f4] px-2 py-1 tabular-nums text-[#0f6b62]">
                        EBITDA {item.ebitda}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <p className="rounded-xl bg-public-sand px-2 py-2">
                        <span className="block text-public-muted">De parte</span>
                        {item.from}
                      </p>
                      <p className="rounded-xl bg-public-sand px-2 py-2">
                        <span className="block text-public-muted">Hacia</span>
                        {item.to}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
