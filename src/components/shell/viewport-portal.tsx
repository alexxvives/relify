"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => undefined;

/**
 * `.shell-content` uses overflow-x: clip, which makes position:fixed descendants
 * stick to that box instead of the viewport. Portal overlays to document.body
 * after hydration (useSyncExternalStore so SSR and the hydrate pass match).
 */
export function ViewportPortal({ children }: { children: ReactNode }) {
  const client = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!client) {
    return children;
  }
  return createPortal(children, document.body);
}
