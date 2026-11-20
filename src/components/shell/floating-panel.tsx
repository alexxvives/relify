"use client";

import { ChevronUp, Minimize2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ViewportPortal } from "@/components/shell/viewport-portal";

/**
 * S33 (Alex): a card that floats over the page at the bottom-right, like Tu progreso, so it never takes a column and the
 * content stays fully visible next to it. Minimizar folds it into a pill; the pill opens it again. It does not close on
 * an outside click, so the advisor can read the company and the card at the same time. Below 1024 px it starts folded and sits above the tab bar
 * (portalled to body, so it cannot read --shell-tabbar).
 */
export function FloatingPanel({
  label,
  badge = null,
  children,
}: {
  label: string;
  /** Short status shown on the pill while folded (e.g. "Depósito"). */
  badge?: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  // On phones and tablets it starts folded, so the company stays readable; the pill keeps the status in view.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setOpen(false);
  }, []);

  return (
    <ViewportPortal>
      <div
        className="pointer-events-none fixed right-3 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-end lg:right-4 lg:bottom-4"
        data-floating-panel
      >
        {open ? (
          <section
            aria-label={label}
            className="pointer-events-auto flex max-h-[calc(100dvh-10rem)] lg:max-h-[min(40rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_12px_32px_-12px_rgba(28,39,64,0.35)]"
            style={{ width: "min(22rem, calc(100vw - 1.5rem))" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#eef0f4] py-1 pr-1 pl-4">
              <p className="text-xs font-semibold tracking-wide text-[#64748b] uppercase">{label}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-expanded="true"
                aria-label={`Minimizar ${label.toLowerCase()}`}
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f5f6f8] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
              >
                <Minimize2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">{children}</div>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded="false"
            className="pointer-events-auto inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#e6e9f0] bg-white/95 pr-3 pl-4 text-sm font-semibold text-[#1c2740] shadow-[0_8px_24px_-12px_rgba(28,39,64,0.4)] backdrop-blur focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
          >
            {label}
            {badge ? <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-xs font-semibold text-[#b42318]">{badge}</span> : null}
            <ChevronUp className="size-4 text-[#64748b]" aria-hidden />
          </button>
        )}
      </div>
    </ViewportPortal>
  );
}
