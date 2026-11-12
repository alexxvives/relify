"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModal } from "@/components/shell/use-modal";

/** Opens the EBITDA adjustment list in a compact dialog so the KPI tile stays the same size. */
export function AdjustmentReview({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="relative z-10 shrink-0 cursor-pointer rounded-full border border-[#d5dbe3] bg-white px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
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
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1220]/55 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjustment-review-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{ width: "min(100%, 42rem)", maxWidth: "42rem" }}
        className="flex max-h-[min(44rem,calc(100dvh-2rem))] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eef0f4] px-5 py-4 sm:px-7">
          <h2 id="adjustment-review-title" className="text-lg font-semibold text-[#1c2740]">
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
        <div className="min-h-0 overflow-y-auto px-1 py-1 sm:px-2 sm:py-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
