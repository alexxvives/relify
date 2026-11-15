import { describe, expect, it } from "vitest";
import { gazeAvatarUrl } from "@/lib/gaze-avatar";

describe("gazeAvatarUrl", () => {
  it("uses the vendored Gaze portrait for waitlist seats (CSP img-src self)", () => {
    const url = gazeAvatarUrl("alba");
    expect(url).toBe("/waitlist/alba.svg");
    expect(url).not.toMatch(/dicebear/i);
  });

  it("cycles vendored Gaze blob portraits for unknown seeds", () => {
    const url = gazeAvatarUrl("perfil-x");
    expect(url).toMatch(/^\/waitlist\/(alba|nube|cala|duna|bruma|olivo|roble|faro)\.svg$/);
    expect(url).not.toMatch(/data:image/);
  });
});
