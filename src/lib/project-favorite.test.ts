import { describe, expect, it } from "vitest";
import { favoriteDecision } from "./project-favorite";

const investor = { onboarded: true, role: "investor" as const, projectStatus: "published" as const, alreadySaved: false };

describe("favoriteDecision", () => {
  it("adds and then removes a published project for an investor", () => {
    expect(favoriteDecision(investor)).toEqual({ ok: true, action: "add" });
    expect(favoriteDecision({ ...investor, alreadySaved: true })).toEqual({ ok: true, action: "remove" });
  });

  it("refuses a seller, a draft, and a signed-out visitor", () => {
    expect(favoriteDecision({ ...investor, role: "seller" }).ok).toBe(false);
    expect(favoriteDecision({ ...investor, projectStatus: "draft" })).toEqual({ ok: false, code: "missing" });
    expect(favoriteDecision({ ...investor, onboarded: false }).ok).toBe(false);
  });
});
