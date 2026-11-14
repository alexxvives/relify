"use client";

import Aurora from "@/components/landing/aurora";
import { useLandingAurora } from "@/components/landing/landing-motion";

/** Teal wash behind the v2 hero. Skipped on compact viewports and reduced motion. */
export function LandingAurora() {
  const show = useLandingAurora();
  if (!show) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(46rem,78svh)] opacity-70" aria-hidden>
      <Aurora
        colorStops={["#7ed9d0", "#0f6e73", "#9fe3dc"]}
        amplitude={0.7}
        blend={0.55}
        speed={0.55}
        opacity={0.9}
        lightMode
        mouseInteraction={false}
        intro={false}
      />
    </div>
  );
}
