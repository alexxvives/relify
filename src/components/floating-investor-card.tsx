"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InvestorPublicCard } from "@/components/investor-public-card";
import type { PublicInvestorCard } from "@/lib/demo-profile";

export function FloatingInvestorCard({
  name,
  profile,
}: {
  name: string;
  profile: PublicInvestorCard | null;
}) {
  const [open, setOpen] = useState(true);

  return (
    <aside className="xl:sticky xl:top-6">
      {open ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className="absolute top-4 right-4 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Ocultar inversor"
          >
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <InvestorPublicCard label={name} profile={profile} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e7eaee] bg-white px-4 py-3 text-left"
          aria-label="Mostrar inversor"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#667085] uppercase">El inversor</span>
            <span className="mt-1 block truncate text-base font-semibold text-[#1c2740]">{name}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
        </button>
      )}
    </aside>
  );
}
