export type StickyBox = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function boxesOverlap(a: StickyBox, b: StickyBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Compact sticky CTAs hide while their inline twin intersects the viewport. */
export function stickyCtaShouldHide(compact: boolean, twin: StickyBox | null, viewport: StickyBox): boolean {
  return compact && twin !== null && boxesOverlap(twin, viewport);
}
