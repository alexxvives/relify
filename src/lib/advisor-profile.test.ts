import { describe, expect, it } from "vitest";
import { advisorGreeting } from "./advisor-copy";
import { corporateInputSchema, servicesInputSchema } from "./advisor-profile";

describe("corporateInputSchema", () => {
  it("accepts a well-formed CIF and rejects a bad control digit", () => {
    const valid = {
      businessName: "Asesoría Norte",
      nif: "b12345674",
      postalCode: "08022",
      description: "Asesoría fiscal y de compraventa con más de veinte años de experiencia en pymes.",
      sectors: ["N"],
    };

    expect(corporateInputSchema.safeParse(valid).success).toBe(true);
    expect(corporateInputSchema.safeParse({ ...valid, nif: "B12345678" }).success).toBe(false);
  });
});

describe("servicesInputSchema", () => {
  it("requires a price range that does not run backwards", () => {
    expect(
      servicesInputSchema.safeParse([
        { serviceType: "DUE_DILIGENCE", priceFrom: "1000", priceTo: "2000" },
      ]).success,
    ).toBe(true);
    expect(
      servicesInputSchema.safeParse([
        { serviceType: "DUE_DILIGENCE", priceFrom: "2000", priceTo: "1000" },
      ]).success,
    ).toBe(false);
    expect(servicesInputSchema.safeParse([]).success).toBe(false);
  });
});

describe("advisorGreeting", () => {
  it("uses the afternoon greeting in the Madrid afternoon", () => {
    expect(advisorGreeting("Alex", new Date("2026-10-03T14:10:00.000Z"))).toBe("Buenas tardes, Alex");
  });
});
