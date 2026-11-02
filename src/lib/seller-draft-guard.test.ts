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
