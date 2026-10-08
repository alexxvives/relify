import { describe, expect, it } from "vitest";
import { investorProfileChecks, publicInvestorCard } from "./demo-profile";
import { investorProfileSchema } from "./investor-profile";

describe("publicInvestorCard", () => {
  it("shows place, ticket, and thesis, and leaves the name, NIF, and email out", () => {
    const card = publicInvestorCard("inversor@itsreleva.com");
    expect(card?.investorType).toBe("Family office");
    expect(card?.place).toBe("Valencia · Comunitat Valenciana");
    expect(card?.ticket).toBe("Entre 1 y 3 millones");
    expect(card?.photo.startsWith("/investors/")).toBe(true);
    expect(card?.thesis.length).toBeGreaterThan(0);
    expect(card?.contribution.length).toBeGreaterThan(0);
    expect(card?.stake).toBe("Mayoría");
    const text = JSON.stringify(card);
    expect(text).not.toContain("Martín");
    expect(text).not.toContain("Soler");
    expect(text).not.toContain("B11111119");
    expect(text).not.toContain("inversor@itsreleva.com");
    expect(text).not.toContain("Mesa Familiar");
    expect(text).not.toContain("46001");
    expect(publicInvestorCard("nadie@example.com")).toBeNull();
  });

  it("counts a published draft as the five home phases", () => {
    const card = publicInvestorCard("inversor@itsreleva.com");
    expect(card).not.toBeNull();
    if (!card) {
      return;
    }
    expect(
      investorProfileChecks({
        photo: card.photo,
        city: "Valencia",
        province: "Comunitat Valenciana",
        investorType: card.investorType,
        ticket: card.ticket,
        sectors: card.sectors,
        thesis: card.thesis,
        contribution: card.contribution,
        stake: card.stake,
      }),
    ).toEqual({ photo: true, place: true, kind: true, search: true, offer: true });
  });
});

describe("investorProfileSchema", () => {
  it("rejects a profile without a city", () => {
    expect(
      investorProfileSchema.safeParse({
        photo: "",
        city: "",
        province: "Valencia",
        investorType: "Particular",
        ticket: "Menos de 500 mil €",
        sectors: "Comercio",
        thesis: "Una tienda con equipo.",
        contribution: "Tiempo.",
        stake: "Mayoría",
      }).success,
    ).toBe(false);
  });
});
