"use client";

import { BadgeCheck, CircleAlert, CircleHelp, Info } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Dark tooltip bubble shared by every hover/tap hint in the app. */
export const tooltipBubble =
  "rounded-xl bg-[#1c2740] px-3 py-2 text-left text-xs leading-5 font-normal whitespace-pre-line text-white shadow-lg";

const icons = { help: CircleHelp, info: Info, warning: CircleAlert, verified: BadgeCheck } as const;

const iconTone = {
  ink: "text-[#8b95a7] hover:text-[#465ab4]",
  light: "text-white/70 hover:text-white",
  warning: "text-[#b54708] hover:text-[#93370d]",
  verified: "text-[#465ab4]",
  verifiedLight: "text-[#7ee2a8]",
} as const;

const widths = { auto: 256, md: 256, lg: 384 } as const;
const margin = 8;

/**
 * Icon with a tooltip. t70: it opens only from its own trigger (hover, keyboard focus, tap) and is
 * rendered in a portal with fixed coordinates clamped to the viewport, so overflow/scroll containers
 * and parent hover states can no longer clip or trigger it.
 */
export function InfoHint({
  text,
  icon = "help",
  tone = "ink",
  align = "start",
  side = "top",
  width = "md",
  size = "md",
  children,
}: {
  text: string;
  icon?: keyof typeof icons;
  tone?: keyof typeof iconTone;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  width?: "auto" | "md" | "lg";
  size?: "sm" | "md";
  /** Optional custom trigger instead of the icon. */
  children?: ReactNode;
}) {
  const Icon = icons[icon];
  const id = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const place = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect();
    const box = bubble.current?.getBoundingClientRect();
    if (!anchor || !box) {
      return;
    }
    const viewport = document.documentElement.clientWidth;
    const want = align === "center" ? anchor.left + anchor.width / 2 - box.width / 2 : align === "end" ? anchor.right - box.width : anchor.left;
    const left = Math.min(Math.max(want, margin), Math.max(viewport - box.width - margin, margin));
    const above = anchor.top - box.height - margin;
    const below = anchor.bottom + margin;
    const fitsAbove = above >= margin;
    const fitsBelow = below + box.height <= window.innerHeight - margin;
    const top = side === "top" ? (fitsAbove || !fitsBelow ? above : below) : fitsBelow || !fitsAbove ? below : above;
    setPos({ left, top: Math.max(top, margin) });
  }, [align, side]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(place);
    const close = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") {
        return;
      }
      if (event.type === "pointerdown" && trigger.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
      setPinned(false);
    };
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, place]);

  const show = () => setOpen(true);
  const hide = () => {
    if (!pinned) {
      setOpen(false);
      setPos(null);
    }
  };

  return (
    <span className="relative inline-flex">
      <span
        ref={trigger}
        tabIndex={0}
        role="button"
        aria-label={text}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={() => {
          setPinned(false);
          setOpen(false);
          setPos(null);
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPinned(!pinned);
          setOpen(!pinned);
        }}
        className={`inline-flex cursor-help items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#465ab4]/40 ${children ? "" : `${size === "sm" ? "size-4" : "size-5"} ${iconTone[tone]}`}`}
      >
        {children ?? <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={bubble}
              id={id}
              role="tooltip"
              style={{ position: "fixed", left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: width === "auto" ? undefined : widths[width], maxWidth: `calc(100vw - ${margin * 2}px)` }}
              className={`pointer-events-none z-[100] ${width === "auto" ? "w-max max-w-64" : ""} ${tooltipBubble}`}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
