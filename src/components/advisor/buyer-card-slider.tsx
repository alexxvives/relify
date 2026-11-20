"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { FloatingInvestorCard } from "@/components/investor/floating-investor-card";
import type { AdvisorBuyerCard } from "@/lib/server/advisory-engagement";

/** S35 (Alex): several buyers on a seller-hired encargo share one card with arrows and a 1/3 count. */
export function BuyerCardSlider({ buyers }: { buyers: AdvisorBuyerCard[] }) {
  const [index, setIndex] = useState(0);
  const current = buyers[Math.min(index, buyers.length - 1)];

  if (!current) {
    return null;
  }

  const arrow =
    "inline-flex size-9 items-center justify-center rounded-full bg-white text-[#1c2740] shadow-sm ring-1 ring-[#e7eaee] disabled:opacity-40";

  return (
    <div className="flex flex-col gap-2" data-buyer-slider>
      {buyers.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button type="button" className={arrow} onClick={() => setIndex((value) => value - 1)} disabled={index === 0} aria-label="Comprador anterior">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="text-sm font-semibold text-[#1c2740]" aria-live="polite">
            {index + 1}/{buyers.length}
          </p>
          <button
            type="button"
            className={arrow}
            onClick={() => setIndex((value) => value + 1)}
            disabled={index >= buyers.length - 1}
            aria-label="Comprador siguiente"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <FloatingInvestorCard key={current.id} name={current.label} profile={current.card} />
    </div>
  );
}
