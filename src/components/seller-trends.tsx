"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SellerTabs } from "@/components/seller-tabs";
import { sellerCopy, trendItems } from "@/lib/seller-copy";

const tabs = [
  { id: "all", label: sellerCopy.trendsAll },
  { id: "news", label: sellerCopy.trendsNews },
  { id: "borme", label: sellerCopy.trendsBorme },
] as const;

type TrendTab = (typeof tabs)[number]["id"];

export function SellerTrends() {
  const [tab, setTab] = useState<TrendTab>("all");
  const items = trendItems.filter((item) => (tab === "all" ? true : item.kind === tab));

  return (
    <div>
      <SellerTabs label={sellerCopy.trendsTitle} tabs={tabs} value={tab} onChange={setTab} />
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-[#c81e1e]">
                  {item.source} · {item.tag}
                </p>
                <h2 className="mt-2 text-base font-semibold text-[#1c2740]">{item.title}</h2>
                {item.region !== "" ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#3d4a63]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {item.region}
                    </span>
                    <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs text-[#2454d6]">{item.cnae}</span>
                  </p>
                ) : null}
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">{item.body}</p>
                {item.revenue !== "" ? (
                  <p className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#1c2740]">
                    <span>{item.revenue}</span>
                    <span>{item.ebitda}</span>
                    <span>{item.value}</span>
                  </p>
                ) : null}
              </div>
              {item.kind === "borme" ? (
                <span className="hidden shrink-0 text-2xl font-semibold tracking-tight text-[#9b1c1c] sm:block" aria-hidden>
                  BOE
                </span>
              ) : (
                <span className="hidden h-16 w-28 shrink-0 rounded-lg bg-[#d9e2ea] sm:block" aria-hidden />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
