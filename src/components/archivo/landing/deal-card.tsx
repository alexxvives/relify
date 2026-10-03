import Image from "next/image";
import { Building2, Factory, Plane, ShoppingBag } from "lucide-react";
import type { ShowcaseDeal } from "@/lib/landing-copy";

const icons = {
  industria: Factory,
  comercio: ShoppingBag,
  servicios: Building2,
  transporte: Plane,
} as const;

const metrics = [
  { label: "Facturación", key: "revenue" },
  { label: "EBITDA", key: "ebitda" },
  { label: "EBITDA ajustado", key: "adjusted" },
  { label: "Precio de venta", key: "price" },
] as const;

export function DealCard({ deal }: { deal: ShowcaseDeal }) {
  const Icon = icons[deal.sector];

  return (
    <article className="w-[270px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_0_6px_-2px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.08)]">
      <div className="relative h-[75px] w-full">
        <Image src={deal.image} alt="" width={270} height={75} className="h-[75px] w-full object-cover" />
        {deal.badge ? (
          <span className="absolute top-2 right-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-[#384753]">
            {deal.badge}
          </span>
        ) : null}
      </div>
      <div className="relative -mt-[15px] flex flex-col gap-2 rounded-[15px] bg-white px-3 pt-0 pb-3">
        <div className="flex h-8 items-end">
          <div className="-mt-4 flex size-12 items-center justify-center rounded-[14px] bg-white shadow-[0_8px_16px_-8px_rgba(43,59,74,0.45)]">
            <Icon className="size-5 text-[#465ab4]" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h3 className="text-[15px] leading-5 font-medium tracking-[-0.01em] text-[#2b3b4a]">{deal.codename}</h3>
          <p className="text-xs text-[#6d7c89]">{deal.region}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-lg bg-[#f4f6f8] px-2 py-1.5">
              <dt className="text-[10px] text-[#7b8792]">{metric.label}</dt>
              <dd className="text-[13px] font-medium text-[#2b3b4a]">{deal[metric.key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
