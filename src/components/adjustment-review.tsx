"use client";

import { useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModal } from "@/components/use-modal";

/** Opens the EBITDA adjustment list in a compact dialog so the KPI tile stays the same size. */
export function AdjustmentReview({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full border border-[#d5dbe3] bg-white px-2 py-0.5 text-[11px] font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
      >
        Ver ajustes
      </button>
      {open ? <AdjustmentReviewDialog onClose={() => setOpen(false)}>{children}</AdjustmentReviewDialog> : null}
    </>
  );
}

function AdjustmentReviewDialog({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useModal(panel, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1220]/55 p-4 sm:items-center" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjustment-review-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[min(32rem,calc(100dvh-2rem))] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
          <h2 id="adjustment-review-title" className="text-sm font-semibold text-[#1c2740]">
            Ajustes al EBITDA
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
