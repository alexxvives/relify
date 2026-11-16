"use client";

import { useSyncExternalStore } from "react";

function subscribeMedia(query: string) {
  return (onStoreChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  };
}

/** Compact layout: phones and tablets below the desktop shell breakpoint. */
export function useCompactViewport(): boolean {
  return useSyncExternalStore(
    subscribeMedia("(max-width: 1023px)"),
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
}

/** Finger-first devices: 44px targets and sheets instead of hover tooltips. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribeMedia("(any-pointer: coarse)"),
    () => window.matchMedia("(any-pointer: coarse)").matches,
    () => false,
  );
}
