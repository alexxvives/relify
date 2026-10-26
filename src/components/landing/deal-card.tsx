import Image from "next/image";
import { specimenMetrics, type ShowcaseDeal } from "@/lib/landing-copy";

export function DealCard({
  deal,
  sequence = false,
  tall = false,
  pulse = false,
  flag,
}: {
  deal: ShowcaseDeal;
  sequence?: boolean;
  tall?: boolean;
  pulse?: boolean;
  flag?: string;
}) {
  return (
    <article className={`overflow-hidden rounded-3xl bg-public-sand ${tall ? "shadow-public" : ""}`}>
      <div className={`relative w-full overflow-hidden ${tall ? "h-56 sm:h-72" : "h-40 sm:h-44"}`}>
        <Image
          src={deal.image}
          alt=""
          fill
          className={pulse ? "releva-hero-photo object-cover" : "object-cover"}
          sizes={tall ? "(min-width: 1024px) 800px, 100vw" : "480px"}
        />
        {flag ? (
          <p className="absolute top-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm text-public-ink">
            <span className={`size-1.5 rounded-full bg-public-clay ${pulse ? "releva-live-dot" : ""}`} aria-hidden="true" />
            {flag}
          </p>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-xs text-public-muted">{deal.region}</p>
        <h3 className="text-lg font-medium">{deal.codename}</h3>
        {deal.badge ? <p className="mt-1 text-xs tracking-[0.12em] text-public-muted uppercase">{deal.badge}</p> : null}
        <dl className={tall ? "mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4" : "mt-4 grid grid-cols-2 gap-x-3 gap-y-3"}>
          {specimenMetrics.map((metric) => (
            <div key={metric.key} className={sequence ? "landing-metric" : undefined}>
              <dt className="text-xs tracking-wide text-public-muted uppercase">{metric.label}</dt>
              <dd className="text-sm font-medium text-public-clay">{deal[metric.key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
