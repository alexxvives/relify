import { describe, expect, it } from "vitest";
import { advisorGreeting } from "@/lib/advisor-copy";
import { advisorProfileChecks, blankAdvisorProfile, corporateInputSchema, servicesInputSchema } from "@/lib/advisor-profile";

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

describe("advisorProfileChecks", () => {
  it("stays empty until the corporate fields and one service are saved", () => {
    expect(advisorProfileChecks(blankAdvisorProfile())).toEqual({
      identity: false,
      description: false,
      sectors: false,
      services: false,
      subscription: false,
    });

    expect(
      advisorProfileChecks({
        ...blankAdvisorProfile(),
        businessName: "Asesoría Norte",
        nif: "B12345674",
        postalCode: "08022",
        description: "Asesoría fiscal y de compraventa con más de veinte años de experiencia en pymes.",
        sectors: ["N"],
        services: [{ serviceType: "DUE_DILIGENCE", priceFromCents: 100_000, priceToCents: 200_000 }],
      }),
    ).toEqual({
      identity: true,
      description: true,
      sectors: true,
      services: true,
      subscription: false,
    });
  });
});

describe("advisorGreeting", () => {
  it("uses the afternoon greeting in the Madrid afternoon", () => {
    expect(advisorGreeting("Alex", new Date("2026-10-03T14:10:00.000Z"))).toBe("Buenas tardes, Alex");
  });
});
