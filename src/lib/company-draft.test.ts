import { describe, expect, it } from "vitest";
import { centsToEuroInput, companyDraftSchema, emptyCompanyDraft, eurosToCents, projectSlug } from "./company-draft";

function draft(overrides: Record<string, unknown>) {
  return { ...emptyCompanyDraft(), ...overrides };
}

describe("company draft money and slug", () => {
  it("stores euros as cents and builds a public slug", () => {
    expect(eurosToCents("1250000")).toBe(125_000_000);
    expect(eurosToCents("1250000,5")).toBe(125_000_050);
    expect(eurosToCents("-1250,5")).toBe(-125_050);
    expect(centsToEuroInput(125_000_050)).toBe("1250000,50");
    expect(centsToEuroInput(-125_050)).toBe("-1250,50");
    expect(projectSlug("Proyecto Árbol Norte")).toBe("proyecto-arbol-norte");
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120,5",
      askingPrice: "800",
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1.000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
    })).success).toBe(false);
  });

  it("requires shareholder percents to sum to 100", () => {
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      capitalPercents: ["60", "40"],
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      capitalPercents: ["60", "30"],
    })).success).toBe(false);
  });
});
