/**
 * S26b: welcome confetti after the Acuerdo con Relify is signed. Two side cannons (left at 60°, right at
 * 120°) for 3 s, driven by requestAnimationFrame. canvas-confetti is loaded on demand, and nothing fires
 * when the user prefers reduced motion.
 */
export const sideCannonColors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"] as const;
export const sideCannonDurationMs = 3000;

export const sideCannonShots = [
  { particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 } },
  { particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 } },
] as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Returns false when skipped (reduced motion, no window). */
export async function fireSideCannons(): Promise<boolean> {
  if (typeof window === "undefined" || prefersReducedMotion()) {
    return false;
  }
  const { default: confettiModule } = await import("canvas-confetti");
  // No web worker: the CSP has no blob: worker source. The library canvas is full-window and resizes.
  const confetti = confettiModule.create(undefined, { resize: true, useWorker: false });
  const end = Date.now() + sideCannonDurationMs;
  const colors = [...sideCannonColors];

  const frame = () => {
    if (Date.now() > end) {
      return;
    }
    for (const shot of sideCannonShots) {
      void confetti({ ...shot, origin: { ...shot.origin }, colors });
    }
    window.requestAnimationFrame(frame);
  };

  frame();
  return true;
}
