import { describe, expect, it } from "vitest";
import { identityChangeHref, lockedIdentity } from "./seller-draft-guard";

describe("lockedIdentity (t78)", () => {
  it("keeps the stored legal name and CIF once the NIF is verified", () => {
    expect(lockedIdentity({ legalName: "Panadería Sol SL", cif: "B12345678" }, { legalName: "Otro Nombre SL", cif: "B87654321" })).toEqual({
      legalName: "Panadería Sol SL",
      cif: "B12345678",
      locked: true,
    });
  });

  it("accepts the submitted values before verification", () => {
    expect(lockedIdentity({ legalName: "", cif: "" }, { legalName: "Nueva SL", cif: "B11111111" })).toMatchObject({ legalName: "Nueva SL", locked: false });
    expect(lockedIdentity(null, { legalName: "Nueva SL", cif: "" }).locked).toBe(false);
  });

  it("builds a mailto for change requests", () => {
    expect(identityChangeHref("info@itsrelify.com", "Proyecto Sol")).toMatch(/^mailto:info@itsrelify\.com\?subject=/);
  });
});

import { sellerMoneyFields } from "./seller-draft-guard";

describe("sellerMoneyFields (t78)", () => {
  it("never writes revenue, EBITDA or OPEX for an existing project", () => {
    const fields = sellerMoneyFields({ askingPrice: "500000", adjustedEbitda: "" }, false);
    expect(fields).toEqual({ askingPriceCents: 50_000_000 });
    expect("revenueCents" in fields || "ebitdaCents" in fields || "opexCents" in fields).toBe(false);
  });

  it("parses decimals and fills required columns with zero for a new project", () => {
    expect(sellerMoneyFields({ askingPrice: "1200,5", adjustedEbitda: "" }, true)).toEqual({
      askingPriceCents: 120_050,
      adjustedEbitdaCents: 0,
      revenueCents: 0,
      ebitdaCents: 0,
      opexCents: null,
    });
  });
});
