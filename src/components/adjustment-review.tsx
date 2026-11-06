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
        aria-label="Ajustes al EBITDA"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[min(28rem,calc(100vh-2rem))] w-full max-w-sm overflow-y-auto rounded-xl shadow-xl outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full text-[#667085] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
}
