import { describe, expect, it } from "vitest";
import { advisoryQuoteSchema, uniqueAdvisoryServices } from "./advisory";

describe("uniqueAdvisoryServices", () => {
  it("keeps known services once and drops the rest", () => {
    expect(uniqueAdvisoryServices(["legal", "legal", "nope", "tax"])).toEqual(["legal", "tax"]);
  });
});

describe("advisoryQuoteSchema", () => {
  it("requires at least one known service", () => {
    expect(advisoryQuoteSchema.safeParse({ services: [], projectSlug: "proyecto-cala" }).success).toBe(false);
    expect(advisoryQuoteSchema.safeParse({ services: ["valuation"], projectSlug: "proyecto-cala" }).success).toBe(true);
    expect(advisoryQuoteSchema.safeParse({ services: ["valuation"] }).success).toBe(false);
  });
});
