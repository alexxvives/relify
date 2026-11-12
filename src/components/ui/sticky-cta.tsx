"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "cn";

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

/** Signed-in pages: sits above the tab bar. Hidden when the keyboard is open. */
export function ShellStickyCtaBar({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const shell = el?.closest(".shell");
    if (!el || !(shell instanceof HTMLElement)) {
      return;
    }
    const apply = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      shell.style.setProperty("--shell-sticky-measured", `${height}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      shell.style.removeProperty("--shell-sticky-measured");
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "shell-sticky-cta fixed inset-x-0 z-30 border-t border-public-line bg-white/95 px-4 pt-3 pb-3 backdrop-blur lg:hidden",
        "bottom-[var(--shell-tabbar)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
