import { describe, expect, it } from "vitest";
import { identityDeclared } from "@/lib/identity-declaration";

describe("identityDeclared", () => {
  it("accepts the checkbox on values", () => {
    expect(identityDeclared("on")).toBe(true);
    expect(identityDeclared("true")).toBe(true);
    expect(identityDeclared("1")).toBe(true);
    expect(identityDeclared("yes")).toBe(true);
  });

  it("rejects missing or empty confirmation", () => {
    expect(identityDeclared(null)).toBe(false);
    expect(identityDeclared("")).toBe(false);
    expect(identityDeclared("off")).toBe(false);
  });
});
