import { describe, expect, it } from "vitest";
import { privateAdvisorFields, publicAdvisorFields, toPublicAdvisorCard } from "./advisor-directory";

const complete = {
  userId: "advisor-1",
  businessName: "Navarro Asesores",
  nif: "B12345674",
  postalCode: "28001",
  description: "Asesoría fiscal y de compraventa con más de veinte años de experiencia en pymes.",
  sectors: ["N"],
  services: [{ serviceType: "DUE_DILIGENCE", priceFromCents: 100_000, priceToCents: 200_000 }],
};

describe("toPublicAdvisorCard", () => {
  it("lists a finished profile without the NIF, the email, or documents", () => {
    const card = toPublicAdvisorCard(complete);

    expect(card?.businessName).toBe("Navarro Asesores");
    expect(card?.sectors).toEqual(["Actividades profesionales, científicas y técnicas"]);
    expect(card?.services[0]?.title).toBe("Due Diligence");
    expect(card?.cases).toEqual([]);
    expect(publicAdvisorFields).toEqual(["userId", "businessName", "sectors", "services", "cases"]);

    for (const key of privateAdvisorFields) {
      expect(card).not.toHaveProperty(key);
    }
  });

  it("hides a half-finished profile", () => {
    expect(toPublicAdvisorCard({ ...complete, businessName: "No" })).toBeNull();
    expect(toPublicAdvisorCard({ ...complete, services: [] })).toBeNull();
  });
});
