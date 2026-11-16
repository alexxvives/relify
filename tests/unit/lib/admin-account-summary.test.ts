import { describe, expect, it } from "vitest";
import { adminAccountSummary } from "@/lib/admin-account-summary";

describe("adminAccountSummary", () => {
  it("counts roles, onboarding, and buyer plans", () => {
    expect(
      adminAccountSummary([
        { role: "seller", onboarded: true, suspended: false, plan: "none" },
        { role: "investor", onboarded: true, suspended: false, plan: "limited" },
        { role: "investor", onboarded: false, suspended: true, plan: "none" },
        { role: "advisor", onboarded: true, suspended: false, plan: "unlimited" },
        { role: null, onboarded: false, suspended: false, plan: "none" },
      ]),
    ).toEqual({
      total: 5,
      seller: 1,
      investor: 2,
      advisor: 1,
      pending: 2,
      suspended: 1,
      none: 1,
      limited: 1,
      unlimited: 0,
    });
  });
});
