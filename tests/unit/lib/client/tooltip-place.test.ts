import { afterEach, describe, expect, it } from "vitest";
import { placeBubble } from "@/lib/client/tooltip-place";

const previousDocument = globalThis.document;
const previousWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, writable: true, value: previousDocument });
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: previousWindow });
});

describe("placeBubble", () => {
  it("puts the tooltip below when it does not fit above, instead of clamping to the top of the viewport", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: { clientWidth: 390 } },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { innerHeight: 844 },
    });
    const anchor = { left: 24, right: 68, top: 120, bottom: 164, width: 44, height: 44 } as DOMRect;
    const box = { left: 0, right: 280, top: 0, bottom: 160, width: 280, height: 160 } as DOMRect;
    const pos = placeBubble(anchor, box, "start", "top");
    expect(pos.top).toBeGreaterThan(anchor.bottom);
    expect(pos.top).toBeLessThan(844 - 8);
  });
});
