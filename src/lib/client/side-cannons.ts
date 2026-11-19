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

/**
 * Returns the confetti canvas, or null when skipped (reduced motion, no window).
 * S32: `host` lets the canvas live inside an open modal <dialog> (the top layer would hide a body canvas), so the
 * confetti fires together with the "Tu cuenta ya está lista" message. Move it to `document.body` before closing.
 */
export async function fireSideCannons(host?: Element | null): Promise<HTMLCanvasElement | null> {
  if (typeof window === "undefined" || prefersReducedMotion()) {
    return null;
  }
  const { default: confettiModule } = await import("canvas-confetti");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100";
  (host ?? document.body).appendChild(canvas);
  // No web worker: the CSP has no blob: worker source. The canvas is full-window and resizes.
  const confetti = confettiModule.create(canvas, { resize: true, useWorker: false });
  // Particles settle about 3 s after the last shot; then the canvas goes away.
  window.setTimeout(() => canvas.remove(), sideCannonDurationMs + 4000);
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
  return canvas;
}
