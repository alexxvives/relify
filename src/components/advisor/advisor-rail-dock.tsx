"use client";

import { ChevronDown, ChevronUp, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ViewportPortal } from "@/components/shell/viewport-portal";
import { engagementCopy } from "@/lib/engagement-copy";

/**
 * S36 (Alex): the buyer card floats over the encargo and takes no column. From 1024 px it sits at the top-right and
 * folds into a small "Comprador" tab there; on phones it is a bottom sheet above the tab bar.
 * S37 (Alex): it starts expanded on entry from 1024 px. Open, it sits below the banner so Tu turno and its button
 * stay clickable; folded, the tab goes back to the top-right corner. On phones the open sheet would cover the whole
 * ficha, so there it starts folded (null = auto: open on lg, folded below).
 */
export function AdvisorBuyerOverlay({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<boolean | null>(null);

  return (
    <ViewportPortal>
      <div
        className={`fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col-reverse lg:inset-x-auto lg:right-6 lg:bottom-auto lg:w-[22rem] lg:flex-col lg:items-end ${
          open === false ? "lg:top-10" : "lg:top-[24rem]"
        }`}
        data-advisor-buyer-overlay
        data-open={open === null ? "auto" : String(open)}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !(value ?? isWide()))}
          aria-expanded={open ?? undefined}
          className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-[#e7eaee] bg-white px-4 text-sm font-semibold text-[#1c2740] shadow-[0_18px_40px_-24px_rgba(28,39,64,0.55)] lg:w-auto"
        >
          <span className="inline-flex items-center gap-2">
            <UserRound className="size-4 text-[#465ab4]" aria-hidden />
            {engagementCopy.railInvestor}
          </span>
          {open === true ? (
            <ChevronDown className="size-4 lg:rotate-180" aria-hidden />
          ) : open === false ? (
            <ChevronUp className="size-4 lg:rotate-180" aria-hidden />
          ) : (
            <ChevronUp className="size-4" aria-hidden />
          )}
        </button>
        <div
          className={`mb-2 max-h-[55dvh] lg:mt-2 lg:mb-0 w-full overflow-y-auto rounded-2xl lg:max-h-[calc(100dvh-28rem)] ${
            open === null ? "hidden lg:block" : open ? "block" : "hidden"
          }`}
        >
          {children}
        </div>
      </div>
    </ViewportPortal>
  );
}

function isWide(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}
