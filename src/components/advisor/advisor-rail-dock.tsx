"use client";

import { Minimize2, UserRound } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { ViewportPortal } from "@/components/shell/viewport-portal";
import { engagementCopy } from "@/lib/engagement-copy";

const wideQuery = "(min-width: 1024px)";

function subscribeWide(onChange: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** S41 (Alex): where the card's "1/2" counter goes, in the header row next to the "Comprador" title. */
export const BuyerOverlayHeaderSlot = createContext<HTMLElement | null>(null);

/**
 * S38 (Alex): the buyer card floats vertically centred on the right edge and may cover the page. Folded, it is a
 * "Comprador" tab at the same spot; opening it morphs the tab into the card (instant with reduced motion). It starts
 * open from 1024 px and folded on phones. Used by the advisor's encargo and the admin's connection view.
 */
export function BuyerCardOverlay({
  children,
  label = engagementCopy.railInvestor,
  autoFold = false,
}: {
  children: ReactNode;
  label?: string;
  /**
   * S41 (Alex): the card starts open on entry and minimises itself when this turns true (the user moved to Chat /
   * Documentos or Reuniones, where the buyer filter sits). Going back does not reopen it.
   */
  autoFold?: boolean;
}) {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => null);
  const [choice, setChoice] = useState<boolean | null>(autoFold ? false : null);
  const [lastAutoFold, setLastAutoFold] = useState(autoFold);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  if (autoFold !== lastAutoFold) {
    setLastAutoFold(autoFold);
    if (autoFold) {
      setChoice(false);
    }
  }
  // S40 (Alex): folding plays the opening backwards: the card fades out first, then the panel shrinks back into the tab
  // (the content used to linger while the panel shrank, then the height snapped).
  const [folding, setFolding] = useState(false);
  const reduce = useReducedMotion();
  const open = choice ?? wide ?? false;
  const fade = reduce ? { duration: 0 } : { duration: 0.16, ease: "easeOut" as const };
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
            onClick={() => {
              if (!open) {
                setChoice(true);
              } else if (reduce) {
                setChoice(false);
              } else {
                setFolding(true);
              }
            }}
            aria-expanded={open}
            title={open ? engagementCopy.railFold : undefined}
            className={
              open
                ? "flex h-11 w-full items-center justify-between gap-2 px-4 text-sm font-semibold text-[#1c2740] hover:bg-[#f7f8fb]"
                : "flex w-11 flex-col items-center gap-2 py-3 text-sm font-semibold text-[#1c2740] hover:bg-[#f7f8fb]"
            }
          >
            <span className={open ? "inline-flex items-center gap-2" : "inline-flex flex-col items-center gap-2"}>
              <UserRound className="size-4 text-[#465ab4]" aria-hidden />
              <span className={open ? "" : "[writing-mode:vertical-rl] rotate-180"}>{label}</span>
              {open ? <span ref={setSlot} className="contents" /> : null}
            </span>
            {open ? <Minimize2 className="size-4" aria-hidden /> : null}
          </motion.button>
          <AnimatePresence
            initial={false}
            onExitComplete={() => {
              if (folding) {
                setFolding(false);
                setChoice(false);
              }
            }}
          >
            {open && !folding ? (
              <motion.div
                key="card"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1, transition: fade }}
                exit={{ opacity: 0, transition: fade }}
                className="max-h-[min(36rem,calc(100dvh-12rem))] overflow-y-auto border-t border-[#eef0f3]"
              >
                <BuyerOverlayHeaderSlot.Provider value={slot}>{children}</BuyerOverlayHeaderSlot.Provider>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </ViewportPortal>
  );
}
