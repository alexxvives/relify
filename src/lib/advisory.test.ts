import { describe, expect, it } from "vitest";
import { advisorInterestBody, advisoryQuoteSchema, advisoryServiceIdFromTitle, uniqueAdvisoryServices } from "./advisory";

describe("advisorInterestBody", () => {
  it("names the services the client asked for", () => {
    expect(advisorInterestBody(["Due Diligence"])).toBe("Hola, me interesan estos servicios: Due Diligence.");
    expect(advisorInterestBody(["Due Diligence", "Consultoría Fiscal"])).toBe(
      "Hola, me interesan estos servicios: Due Diligence y Consultoría Fiscal.",
    );
    expect(advisoryServiceIdFromTitle("Consultoría fiscal")).toBe("tax");
    expect(advisoryServiceIdFromTitle("Otro")).toBeNull();
  });
});

describe("uniqueAdvisoryServices", () => {
  it("keeps known services once and drops the rest", () => {
    expect(uniqueAdvisoryServices(["legal", "legal", "nope", "tax"])).toEqual(["legal", "tax"]);
  });
});

describe("advisoryQuoteSchema", () => {
  it("requires at least one known service", () => {
    expect(advisoryQuoteSchema.safeParse({ services: [], projectSlug: "proyecto-cala" }).success).toBe(false);
    expect(advisoryQuoteSchema.safeParse({ services: ["valuation"], projectSlug: "proyecto-cala" }).success).toBe(true);
    expect(advisoryQuoteSchema.safeParse({ services: ["valuation"] }).success).toBe(true);
    expect(advisoryQuoteSchema.safeParse({ services: ["valuation"], advisorId: "asesor-1" }).success).toBe(false);
    expect(
      advisoryQuoteSchema.safeParse({ services: ["valuation"], advisorId: "asesor-1", projectSlug: "proyecto-cala" }).success,
    ).toBe(true);
  });
});
