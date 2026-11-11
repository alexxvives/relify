import { describe, expect, it } from "vitest";
import { gazeAvatarUrl } from "./gaze-avatar";

describe("gazeAvatarUrl", () => {
  it("returns a local SVG data URI so CSP img-src self/data/blob can load it", () => {
    const url = gazeAvatarUrl("alba");
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    expect(url).not.toMatch(/dicebear/i);
  });
});
