"use client";

import { useSyncExternalStore } from "react";

function subscribeMotion(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function subscribeAurora(onStoreChange: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 1024px)");
  motion.addEventListener("change", onStoreChange);
  wide.addEventListener("change", onStoreChange);
  return () => {
    motion.removeEventListener("change", onStoreChange);
    wide.removeEventListener("change", onStoreChange);
  };
}

/** False on the server and during hydration so markup matches. */
export function useAllowsMotion() {
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  return !reduced;
}

/** Desktop wash only; false until after hydration. */
export function useLandingAurora() {
  return useSyncExternalStore(
    subscribeAurora,
    () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}
