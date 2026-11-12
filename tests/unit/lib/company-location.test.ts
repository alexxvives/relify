import { describe, expect, it } from "vitest";
import { formatCompanyLocation, resolveCompanyLocation, titleCasePlace } from "@/lib/company-location";

describe("resolveCompanyLocation", () => {
  it("prefers SABI postal_code and city columns and locks them", () => {
    expect(
      resolveCompanyLocation({
        address: "CALLE FALSA, 123, 28001 MADRID (Madrid)",
        postalCode: "28001",
        city: "MADRID",
        region: "Madrid",
      }),
    ).toEqual({ postalCode: "28001", city: "Madrid", fromRegistry: true });
  });

  it("parses a composed SABI address when columns are empty", () => {
    expect(
      resolveCompanyLocation({
        address: "CALLE FALSA, 123, 28001 MADRID (Madrid)",
        region: "Madrid",
      }),
    ).toEqual({ postalCode: "28001", city: "Madrid", fromRegistry: false });
  });

  it("formats an already short location", () => {
    expect(resolveCompanyLocation({ address: "08022, Barcelona" })).toEqual({
      postalCode: "08022",
      city: "Barcelona",
      fromRegistry: false,
    });
  });

  it("takes the municipality from API Empresas when there is no CP", () => {
    expect(
      resolveCompanyLocation({
        address: "AVENIDA DE LA DIPUTACION S/N, Arteixo, A Coruña",
        region: "A Coruña",
      }),
    ).toEqual({ postalCode: "", city: "Arteixo", fromRegistry: false });
  });

  it("treats a lone place name as the city", () => {
    expect(resolveCompanyLocation({ address: "Madrid", region: "Madrid" })).toEqual({
      postalCode: "",
      city: "Madrid",
      fromRegistry: false,
    });
  });

  it("reads a parenthetical town from a BORME-style street", () => {
    expect(
      resolveCompanyLocation({
        address: "C/ ALFONSO ROIG ALFONSO S/N (ALBALAT DELS SORELLS), Valencia",
        region: "Valencia",
      }),
    ).toEqual({ postalCode: "", city: "Albalat dels Sorells", fromRegistry: false });
  });
});

describe("formatCompanyLocation", () => {
  it("renders CP and city as 08022, Barcelona", () => {
    expect(formatCompanyLocation("08022", "barcelona")).toBe("08022, Barcelona");
    expect(formatCompanyLocation("", "Barcelona")).toBe("Barcelona");
    expect(formatCompanyLocation("08022", "")).toBe("08022");
  });
});

describe("titleCasePlace", () => {
  it("keeps Spanish small words lower after the first", () => {
    expect(titleCasePlace("ALBALAT DELS SORELLS")).toBe("Albalat dels Sorells");
  });
});
