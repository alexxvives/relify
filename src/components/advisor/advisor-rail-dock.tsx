"use client";

import { ChevronRight, UserRound } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ViewportPortal } from "@/components/shell/viewport-portal";
import { engagementCopy } from "@/lib/engagement-copy";

const wideQuery = "(min-width: 1024px)";

function subscribeWide(onChange: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * S38 (Alex): the buyer card floats vertically centred on the right edge and may cover the page. Folded, it is a
 * "Comprador" tab at the same spot; opening it morphs the tab into the card (instant with reduced motion). It starts
 * open from 1024 px and folded on phones. Used by the advisor's encargo and the admin's connection view.
 */
export function BuyerCardOverlay({ children, label = engagementCopy.railInvestor }: { children: ReactNode; label?: string }) {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const reduce = useReducedMotion();
  const open = choice ?? wide ?? false;
  const transition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 34 };

  return (
    <ViewportPortal>
      <div
        className="pointer-events-none fixed top-1/2 right-0 z-40 flex -translate-y-1/2 justify-end pr-2 sm:pr-4"
        data-advisor-buyer-overlay
        data-open={String(open)}
      >
        <motion.div
          layout
          transition={transition}
          style={{ borderRadius: open ? 18 : 14 }}
          className={`pointer-events-auto overflow-hidden border border-[#e7eaee] bg-white shadow-[0_24px_60px_-24px_rgba(28,39,64,0.55)] ${
            open ? "w-[min(22rem,calc(100vw-1.5rem))]" : "w-11"
          }`}
        >
          <motion.button
            layout="position"
            type="button"
            onClick={() => setChoice(!open)}
            aria-expanded={open}
            className={
              open
                ? "flex h-11 w-full items-center justify-between gap-2 px-4 text-sm font-semibold text-[#1c2740] hover:bg-[#f7f8fb]"
                : "flex w-11 flex-col items-center gap-2 py-3 text-sm font-semibold text-[#1c2740] hover:bg-[#f7f8fb]"
            }
          >
            <span className={open ? "inline-flex items-center gap-2" : "inline-flex flex-col items-center gap-2"}>
              <UserRound className="size-4 text-[#465ab4]" aria-hidden />
              <span className={open ? "" : "[writing-mode:vertical-rl] rotate-180"}>{label}</span>
            </span>
            {open ? <ChevronRight className="size-4" aria-hidden /> : null}
          </motion.button>
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="card"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.12 } }}
                className="max-h-[min(36rem,calc(100dvh-12rem))] overflow-y-auto border-t border-[#eef0f3]"
              >
                {children}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </ViewportPortal>
  );
}
