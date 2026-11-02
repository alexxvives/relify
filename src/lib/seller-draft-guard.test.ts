import { describe, expect, it } from "vitest";
import { lockedIdentity } from "./seller-draft-guard";

describe("lockedIdentity (t78)", () => {
  it("keeps the stored legal name and CIF once the NIF is verified", () => {
    expect(lockedIdentity({ legalName: "Panadería Sol SL", cif: "B12345678" }, { legalName: "Otro Nombre SL", cif: "B87654321" })).toEqual({
      legalName: "Panadería Sol SL",
      cif: "B12345678",
      locked: true,
    });
  });

  it("fills a never-saved legal name once, keeping the CIF locked", () => {
    expect(
      lockedIdentity({ legalName: "", cif: "B12345678" }, { legalName: "Registro SL", cif: "X" }),
    ).toEqual({ legalName: "Registro SL", cif: "B12345678", locked: true });
  });

  it("accepts the submitted values before verification", () => {
    expect(lockedIdentity({ legalName: "", cif: "" }, { legalName: "Nueva SL", cif: "B11111111" })).toMatchObject({ legalName: "Nueva SL", locked: false });
    expect(lockedIdentity(null, { legalName: "Nueva SL", cif: "" }).locked).toBe(false);
  });

});

import { sellerAdjustmentWrite, sellerMoneyFields } from "./seller-draft-guard";

describe("sellerMoneyFields (t78)", () => {
  it("never writes revenue, EBITDA or OPEX for an existing project", () => {
    const fields = sellerMoneyFields({ askingPrice: "500000", adjustedEbitda: "999" } as { askingPrice: string }, false);
    expect(fields).toEqual({ askingPriceCents: 50_000_000 });
    expect("revenueCents" in fields || "ebitdaCents" in fields || "opexCents" in fields).toBe(false);
  });

  it("parses decimals and fills required columns with zero for a new project", () => {
    expect(sellerMoneyFields({ askingPrice: "1200,5" }, true)).toEqual({
      askingPriceCents: 120_050,
      adjustedEbitdaCents: 0,
      revenueCents: 0,
      ebitdaCents: 0,
      opexCents: null,
    });
  });
});

describe("sellerAdjustmentWrite (t82)", () => {
  const rows = JSON.stringify([
    { type: "owner_salary", amount: "30000", reason: "Sueldo del socio" },
    { type: "one_off", amount: "-5000", reason: "Subvención puntual" },
  ]);

  it("computes the adjusted EBITDA from the stored accounts EBITDA, not from the client", () => {
    const result = sellerAdjustmentWrite(rows, { ebitdaCents: 10_000_000, hasList: false });
    expect(result).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: 12_500_000 } });
  });

  it("ignores a forged total in the posted rows", () => {
    const forged = JSON.stringify([{ type: "other", amount: "100", reason: "Ajuste", adjustedEbitda: "99999999", total: 1 }]);
    const result = sellerAdjustmentWrite(forged, { ebitdaCents: -50_000, hasList: false });
    expect(result).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: -40_000 } });
  });

  it("keeps a legacy figure when the field is absent or the list stays empty, clears a removed list", () => {
    expect(sellerAdjustmentWrite("", { ebitdaCents: 1, hasList: true })).toEqual({ ok: true, write: { kind: "keep" } });
    expect(sellerAdjustmentWrite("[]", { ebitdaCents: 1, hasList: false })).toEqual({ ok: true, write: { kind: "keep" } });
    expect(sellerAdjustmentWrite("[]", { ebitdaCents: 1, hasList: true })).toEqual({ ok: true, write: { kind: "clear" } });
  });

  it("rejects invalid rows", () => {
    expect(sellerAdjustmentWrite('[{"type":"other","amount":"0","reason":"abc"}]', null).ok).toBe(false);
  });
});
