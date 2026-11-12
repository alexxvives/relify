const margin = 8;

/** t71: fixed-position bubble style shared with the chart tooltips: wraps, never wider than the viewport. */
export function tooltipBox(pos: { left: number; top: number } | null, size: { min: number; max: number } = { min: 240, max: 360 }) {
  return {
    position: "fixed" as const,
    left: pos?.left ?? -9999,
    top: pos?.top ?? -9999,
    width: "max-content",
    minWidth: size.min > 0 ? `min(${size.min}px, calc(100vw - ${margin * 2}px))` : undefined,
    maxWidth: `min(${size.max}px, calc(100vw - ${margin * 2}px))`,
    overflowWrap: "break-word" as const,
  };
}

/** t71: place a bubble centred over (or under) an anchor rect, clamped to the viewport. */
export function placeBubble(anchor: DOMRect, box: DOMRect, align: "start" | "center" | "end" = "center", side: "top" | "bottom" = "top") {
  const viewport = document.documentElement.clientWidth;
  const want = align === "center" ? anchor.left + anchor.width / 2 - box.width / 2 : align === "end" ? anchor.right - box.width : anchor.left;
  const left = Math.min(Math.max(want, margin), Math.max(viewport - box.width - margin, margin));
  const above = anchor.top - box.height - margin;
  const below = anchor.bottom + margin;
  const fitsAbove = above >= margin;
  const fitsBelow = below + box.height <= window.innerHeight - margin;
  const top = side === "top" ? (fitsAbove ? above : below) : fitsBelow ? below : above;
  const maxTop = Math.max(window.innerHeight - box.height - margin, margin);
  return { left, top: Math.min(Math.max(top, margin), maxTop) };
}
