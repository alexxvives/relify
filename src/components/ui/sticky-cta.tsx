import type { ReactNode } from "react";
import { cn } from "cn";

/** Public pages: sits on the home indicator. Hidden from the desktop layout. */
export function StickyCtaBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-public-line bg-white/95 px-4 pt-3 backdrop-blur lg:hidden",
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
  return (
    <div
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
