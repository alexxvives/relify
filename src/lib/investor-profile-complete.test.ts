import { describe, expect, it } from "vitest";
import { investorProfileIsComplete } from "./investor-profile-complete";

const full = { investorType: "Particular", ticket: "500k-1M", sectors: "Industria", thesis: "Compro pymes rentables." };

describe("investorProfileIsComplete", () => {
  it("accepts a filled profile", () => {
    expect(investorProfileIsComplete(full)).toBe(true);
  });

  it("rejects a missing description or criteria", () => {
    expect(investorProfileIsComplete({ ...full, thesis: "  " })).toBe(false);
    expect(investorProfileIsComplete({ ...full, ticket: "" })).toBe(false);
  });
});
