import { describe, expect, it } from "vitest";
import { boxesOverlap, stickyCtaShouldHide } from "./sticky-cta-visibility";

const viewport = { top: 0, right: 390, bottom: 844, left: 0 };

describe("stickyCtaShouldHide", () => {
  it("hides on compact when the twin intersects the viewport", () => {
    const twin = { top: 700, right: 370, bottom: 820, left: 20 };
    expect(boxesOverlap(twin, viewport)).toBe(true);
    expect(stickyCtaShouldHide(true, twin, viewport)).toBe(true);
  });

  it("stays visible when the twin is below the fold", () => {
    const twin = { top: 900, right: 370, bottom: 1020, left: 20 };
    expect(stickyCtaShouldHide(true, twin, viewport)).toBe(false);
  });

  it("never hides on the desktop shell", () => {
    const twin = { top: 100, right: 370, bottom: 200, left: 20 };
    expect(stickyCtaShouldHide(false, twin, viewport)).toBe(false);
  });
});
