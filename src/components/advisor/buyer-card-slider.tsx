"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { BuyerOverlayHeaderSlot } from "@/components/advisor/advisor-rail-dock";
import { FloatingInvestorCard } from "@/components/investor/floating-investor-card";
import type { AdvisorBuyerCard } from "@/lib/server/advisory-engagement";

/** S35 (Alex): several buyers on a seller-hired encargo share one card with arrows and a 1/3 count. */
export function BuyerCardSlider({ buyers }: { buyers: AdvisorBuyerCard[] }) {
  const [index, setIndex] = useState(0);
  const slot = useContext(BuyerOverlayHeaderSlot);
  const current = buyers[Math.min(index, buyers.length - 1)];

  if (!current) {
    return null;
  }

  // S40 (Alex): the arrows sit on the card's sides, vertically centred.
  const arrow =
    "absolute top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1c2740] shadow-md ring-1 ring-[#e7eaee] disabled:opacity-0";
  const many = buyers.length > 1;

  return (
    <div className="flex flex-col gap-2" data-buyer-slider>
      {/* S41 (Alex): inside the overlay the count sits in the header row, next to "Comprador". */}
      {many ? (
        slot ? (
          createPortal(
            <span className="text-sm font-semibold text-[#64748b] tabular-nums" aria-live="polite" data-buyer-count>
              {index + 1}/{buyers.length}
            </span>,
            slot,
          )
        ) : (
          <p className="pt-2 text-center text-sm font-semibold text-[#1c2740]" aria-live="polite" data-buyer-count>
            {index + 1}/{buyers.length}
          </p>
        )
      ) : null}
      <div className="relative">
        <FloatingInvestorCard key={current.id} name={current.label} profile={current.card} />
        {many ? (
          <>
            <button type="button" className={`${arrow} left-1.5`} onClick={() => setIndex((value) => value - 1)} disabled={index === 0} aria-label="Comprador anterior">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={`${arrow} right-1.5`}
              onClick={() => setIndex((value) => value + 1)}
              disabled={index >= buyers.length - 1}
              aria-label="Comprador siguiente"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
