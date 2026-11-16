"use client";

import type { ReactNode } from "react";
import FadeContent from "@/components/landing/fade-content";

/** Scroll-in fade for landing v2. FadeContent skips the tween when motion is reduced. */
export function LandingReveal({ children }: { children: ReactNode }) {
  return (
    <FadeContent effect="fade" duration={0.55} threshold={0.12} initialOpacity={0} once>
      {children}
    </FadeContent>
  );
}
