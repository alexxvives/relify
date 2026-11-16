import { describe, expect, it } from "vitest";
import { grantPlanSchema } from "@/lib/grant-plan";

describe("grantPlanSchema", () => {
  it("accepts none so admin can clear a plan", () => {
    expect(grantPlanSchema.parse({ userId: "acct_1", plan: "none" })).toEqual({
      userId: "acct_1",
      plan: "none",
    });
  });

  it("still accepts limited and unlimited grants", () => {
    expect(grantPlanSchema.parse({ userId: "acct_1", plan: "limited" }).plan).toBe("limited");
    expect(grantPlanSchema.parse({ userId: "acct_1", plan: "unlimited" }).plan).toBe("unlimited");
  });

  it("rejects an unknown plan", () => {
    expect(grantPlanSchema.safeParse({ userId: "acct_1", plan: "pro" }).success).toBe(false);
  });
});
