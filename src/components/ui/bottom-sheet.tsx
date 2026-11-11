"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useModalScrollLock } from "@/components/file-preview-dialog";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useModalScrollLock(open);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = panel.current;
    const focusables = root
      ? [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
          (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true",
        )
      : [];
    focusables[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden" role="presentation">
      <button type="button" className="absolute inset-0 bg-[#1c2740]/45" aria-label="Cerrar" onClick={onClose} />
      <div
        ref={panel}
        data-bottom-sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(88dvh,40rem)] flex-col overflow-hidden rounded-t-[1.5rem] bg-white text-[#1c2740] shadow-[0_-18px_40px_-24px_rgba(28,39,64,0.45)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-2">
          <span className="mx-auto h-1 w-10 rounded-full bg-[#d5dbe3]" aria-hidden />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3">
          <h2 id={titleId} className="min-w-0 text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#5c6b78] hover:bg-public-sand"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-public-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        ) : (
          <div className="h-[env(safe-area-inset-bottom,0px)] shrink-0" />
        )}
      </div>
    </div>,
    document.body,
  );
}
