import { describe, expect, it } from "vitest";
import { publicInvestorCard } from "./demo-profile";

describe("publicInvestorCard", () => {
  it("keeps the thesis and leaves the name, NIF, and email out", () => {
    const card = publicInvestorCard("inversor@itsreleva.com");
    expect(card?.investorType).toBe("Family office");
    expect(card?.thesis.length).toBeGreaterThan(0);
    const text = JSON.stringify(card);
    expect(text).not.toContain("Martín");
    expect(text).not.toContain("Soler");
    expect(text).not.toContain("B11111119");
    expect(text).not.toContain("inversor@itsreleva.com");
    expect(text).not.toContain("Mesa Familiar");
    expect(publicInvestorCard("nadie@example.com")).toBeNull();
  });
});
