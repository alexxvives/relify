import { describe, expect, it } from "vitest";
import { toMandateView } from "@/lib/sale-mandate";

describe("toMandateView", () => {
  it("keeps the public card and drops identity", () => {
    const view = toMandateView({
      slug: "proyecto-duna",
      codename: "Proyecto Duna",
      region: "Canarias",
      revenueCents: 980_000_00,
      ebitdaCents: 180_000_00,
      adjustedEbitdaCents: 160_000_00,
      askingPriceCents: 1_200_000_00,
      legalName: "Duna Servicios",
      cif: "B11223344",
      address: "Avenida Marítima",
      fileName: "impuestos-duna.pdf",
    });

    expect(view).toEqual({
      slug: "proyecto-duna",
      codename: "Proyecto Duna",
      region: "Canarias",
      revenueCents: 980_000_00,
      ebitdaCents: 180_000_00,
      adjustedEbitdaCents: 160_000_00,
      askingPriceCents: 1_200_000_00,
    });
    expect(view).not.toHaveProperty("legalName");
    expect(view).not.toHaveProperty("cif");
    expect(view).not.toHaveProperty("address");
    expect(view).not.toHaveProperty("fileName");
  });
});
