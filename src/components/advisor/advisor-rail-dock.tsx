"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ViewportPortal } from "@/components/shell/viewport-portal";
import { engagementCopy } from "@/lib/engagement-copy";

const wideQuery = "(min-width: 1280px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * S34 (Alex): the buyer card and the deposit keep their pre-S33 look. From 1280 px the buyer card sits in the sticky
 * right column and the deposit floats over the page (S35). Below that they share a sticky bottom area with a segmented control (Depósito / Comprador), so both stay
 * reachable on small screens while the company stays readable. No floating pill.
 */
export function AdvisorRailDock({ deposit, investor }: { deposit: ReactNode; investor: ReactNode }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(wideQuery).matches, () => true);
  const tabs = [
    deposit ? { id: "deposit" as const, label: engagementCopy.railDeposit, node: deposit } : null,
    investor ? { id: "investor" as const, label: engagementCopy.railInvestor, node: investor } : null,
  ].filter((tab) => tab !== null);
  const [active, setActive] = useState<"deposit" | "investor">(tabs[0]?.id ?? "deposit");
  const [open, setOpen] = useState(false);

  if (wide) {
    // S35 (Alex): the deposit floats over the page (bottom-right, folds like Tu progreso) and never pushes content aside;
    // the buyer cards keep the sticky right column.
    return (
      <>
        {investor ? (
          <aside className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col overflow-y-auto">{investor}</aside>
        ) : null}
        {deposit ? (
          <ViewportPortal>
            <div className="fixed right-6 bottom-6 z-40 w-[24rem] max-w-[calc(100vw-3rem)]" data-advisor-deposit-overlay>
              <div className="max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-2xl">{deposit}</div>
            </div>
          </ViewportPortal>
        ) : null}
      </>
    );
  }

  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <ViewportPortal>
      <div
        className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-[#f4f6f8] shadow-[0_18px_40px_-24px_rgba(28,39,64,0.55)] lg:right-4 lg:bottom-4 lg:left-auto lg:w-[24rem]"
        data-advisor-dock
      >
        <div className="flex items-center gap-2 p-1.5">
          <div role="tablist" aria-label="Encargo" className="flex flex-1 gap-1 rounded-xl bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={open && current?.id === tab.id}
                onClick={() => {
                  setActive(tab.id);
                  setOpen(!(open && current?.id === tab.id));
                }}
                className={`h-11 flex-1 rounded-lg text-sm font-semibold transition ${open && current?.id === tab.id ? "bg-[#1c2740] text-white" : "text-[#1c2740] hover:bg-[#f4f6f8]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Ocultar" : "Mostrar"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1c2740]"
          >
            {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronUp className="size-4" aria-hidden />}
          </button>
        </div>
        {open && current ? <div className="max-h-[55dvh] overflow-y-auto px-1.5 pb-1.5">{current.node}</div> : null}
      </div>
    </ViewportPortal>
  );
}
