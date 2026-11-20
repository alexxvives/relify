import { describe, expect, it } from "vitest";
import { advisorCopy } from "@/lib/advisor-copy";

// S34: the S33 website autofill (site-url, describe-from-website) was removed; only the copy checks remain.
describe("S33 copy", () => {
  it("merges the marketplace section and recommends the RC insurance", () => {
    expect(advisorCopy.servicesPanelTitle).toBe("Tu perfil en el marketplace");
    expect(advisorCopy.documentsInsurance).toMatch(/seguro de responsabilidad civil/);
  });
});
