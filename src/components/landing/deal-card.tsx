import Image from "next/image";
import type { ShowcaseDeal } from "@/lib/landing-copy";

const metrics = [
  { label: "Facturación", key: "revenue" },
  { label: "EBITDA", key: "ebitda" },
  { label: "EBITDA ajustado", key: "adjusted" },
  { label: "Precio de venta", key: "price" },
] as const;

export function DealCard({ deal }: { deal: ShowcaseDeal }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-public-sand">
      <Image src={deal.image} alt="" width={480} height={220} className="h-36 w-full object-cover" />
      <div className="p-4">
        <p className="text-xs text-public-muted">{deal.region}</p>
        <h3 className="text-lg font-medium">{deal.codename}</h3>
        {deal.badge ? <p className="mt-1 text-[11px] tracking-[0.12em] text-public-muted uppercase">{deal.badge}</p> : null}
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {metrics.map((metric) => (
            <div key={metric.key}>
              <dt className="text-[10px] tracking-wide text-public-muted uppercase">{metric.label}</dt>
              <dd className="text-sm font-medium text-public-clay">{deal[metric.key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
