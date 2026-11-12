"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import { stickyCtaShouldHide, type StickyBox } from "@/lib/client/sticky-cta-visibility";

function boxOf(el: Element | null): StickyBox | null {
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return null;
  }
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
}

function findTwin(sticky: HTMLElement, shell: HTMLElement): HTMLElement | null {
  const node =
    sticky.closest("[data-sticky-twin]") ??
    sticky.parentElement?.querySelector("[data-sticky-twin]") ??
    shell.querySelector("[data-sticky-twin]");
  return node instanceof HTMLElement ? node : null;
}

/** Public pages: sits on the home indicator, or above the cookie bar. Hidden from the desktop layout. */
export function StickyCtaBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-30 border-t border-public-line bg-white/95 px-4 pt-3 backdrop-blur lg:hidden",
        "bottom-[var(--relify-consent-h,0px)]",
        "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Signed-in pages: sits above the tab bar. Hidden while the inline twin is on screen, and when the keyboard is open. */
export function ShellStickyCtaBar({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [occluded, setOccluded] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    const shell = el?.closest(".shell");
    if (!el || !(shell instanceof HTMLElement)) {
      return;
    }
    const mq = window.matchMedia("(max-width: 1023px)");
    let lastHeight = 0;
    const apply = () => {
      const twin = findTwin(el, shell);
      const hide = stickyCtaShouldHide(mq.matches, boxOf(twin), {
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        left: 0,
      });
      setOccluded(hide);
      const measured = Math.ceil(el.getBoundingClientRect().height);
      if (measured > 0) {
        lastHeight = measured;
      }
      shell.style.setProperty("--shell-sticky-measured", hide ? "0px" : `${lastHeight}px`);
    };
    apply();
    const twin = findTwin(el, shell);
    const io = new IntersectionObserver(apply, { threshold: 0 });
    if (twin) {
      io.observe(twin);
    }
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    window.addEventListener("scroll", apply, { capture: true, passive: true });
    window.addEventListener("resize", apply);
    mq.addEventListener("change", apply);
    return () => {
      io.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", apply, true);
      window.removeEventListener("resize", apply);
      mq.removeEventListener("change", apply);
      shell.style.removeProperty("--shell-sticky-measured");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-shell-chrome="sticky"
      data-occluded={occluded ? "true" : "false"}
      aria-hidden={occluded}
      inert={occluded ? true : undefined}
      className={cn(
        "shell-sticky-cta fixed inset-x-0 z-30 border-t border-public-line bg-white/95 px-4 pt-3 pb-3 backdrop-blur lg:hidden",
        "bottom-[var(--shell-tabbar)]",
        occluded && "pointer-events-none invisible",
        className,
      )}
    >
      {children}
    </div>
  );
}
