"use client";

import { useEffect } from "react";
import { scrollToCenter, stickyHeaderOffset } from "@/components/shell/use-scroll-spy";

/**
 * S39/S40 (Alex): checklist deep links (?ancla=<id>) land on their field in one scroll (below the sticky header, once
 * the layout has stopped moving) and sweep a highlighter-pen mark over the field title (`[data-field-title]`, styled
 * by `.relify-marker` in globals.css, static under reduced motion). Shared by the seller's Detalles de empresa and the
 * advisor's Mis servicios.
 */
export function highlightTarget(target: HTMLElement, instant = false, { focus = true }: { focus?: boolean } = {}) {
  const flashTarget =
    target.matches("[data-flash]")
      ? target
      : (target.querySelector<HTMLElement>("[data-flash]") ??
        target.querySelector<HTMLElement>("input:not([type='hidden']), textarea, select, button:not([aria-hidden]), [role='radiogroup']") ??
        target);
  const focusTarget = flashTarget.matches("input, textarea, select, button")
    ? flashTarget
    : (flashTarget.querySelector<HTMLElement>("input:not([type='hidden']), textarea, select, button") ?? flashTarget);
  const title = target.querySelector<HTMLElement>("[data-field-title]") ?? (target.matches("[data-field-title]") ? target : null);
  if (instant) {
    const rect = target.getBoundingClientRect();
    const visible = window.innerHeight - stickyHeaderOffset;
    const top = rect.top + window.scrollY - stickyHeaderOffset - Math.max(16, (visible - rect.height) / 2);
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  } else {
    scrollToCenter(target);
  }
  if (focus) focusTarget.focus({ preventScroll: true });
  const marked = title ?? flashTarget;
  marked.classList.remove("relify-marker");
  void marked.offsetWidth;
  marked.classList.add("relify-marker");
  window.setTimeout(() => marked.classList.remove("relify-marker"), 2800);
}

/** Waits for the element, opens any <details> around it, waits for a stable top (3 frames, max ~1 s), then lands. */
export function landOnAnchor(id: string, { cancelled, onLand }: { cancelled: () => boolean; onLand?: () => void }) {
  const started = Date.now();
  function attempt() {
    if (cancelled()) return;
    const target = document.getElementById(id);
    if (!target) {
      if (Date.now() - started < 4000) window.setTimeout(attempt, 100);
      return;
    }
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement && !node.open) node.open = true;
    }
    let last = Number.NaN;
    let still = 0;
    const begun = Date.now();
    const settleThenGo = () => {
      if (cancelled()) return;
      const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
      still = top === last ? still + 1 : 0;
      last = top;
      if (still < 3 && Date.now() - begun < 1000) {
        window.requestAnimationFrame(settleThenGo);
        return;
      }
      onLand?.();
      highlightTarget(target, true);
    };
    window.requestAnimationFrame(settleThenGo);
  }
  window.setTimeout(attempt, 50);
}

/** Runs the deep link once on mount when the URL carries ?ancla=<id>. */
export function useDeepLinkMarker() {
  useEffect(() => {
    const ancla = new URLSearchParams(window.location.search).get("ancla") ?? "";
    if (!/^[\w-]+$/.test(ancla)) return;
    let cancelled = false;
    landOnAnchor(ancla, { cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * S43 (Alex): an in-page jump (Acciones pendientes → Ir al proceso): smooth-scroll to the element with that id and
 * sweep the marker over its `[data-field-title]`, without navigating or moving the keyboard focus. Returns false when
 * the element is not on the page, so the caller can fall back to a link.
 */
export function jumpToAnchor(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  highlightTarget(target, false, { focus: false });
  return true;
}
