import { describe, expect, it } from "vitest";
import { declaredAccountsCents, ebitdaPublishable, lockedIdentity, projectHasPendingAdjustments } from "@/lib/seller-draft-guard";

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

import { askingPriceAllowed, priceBasisCents, sellerAdjustmentWrite, sellerMoneyFields } from "@/lib/seller-draft-guard";

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

describe("asking price needs a positive EBITDA basis (t94)", () => {
  it("uses the adjusted EBITDA when there are adjustments, else the EBITDA", () => {
    expect(priceBasisCents({ hasAdjustments: true, adjustedEbitdaCents: 89_000_112, ebitdaCents: -10_999_888 })).toBe(89_000_112);
    expect(priceBasisCents({ hasAdjustments: false, adjustedEbitdaCents: 89_000_112, ebitdaCents: -10_999_888 })).toBe(-10_999_888);
    expect(askingPriceAllowed(1)).toBe(true);
    expect(askingPriceAllowed(0)).toBe(false);
    expect(askingPriceAllowed(-5)).toBe(false);
    expect(askingPriceAllowed(null)).toBe(false);
  });

  it("ignores the submitted price when not allowed, keeping the stored one", () => {
    expect(sellerMoneyFields({ askingPrice: "500000" }, false, false)).toEqual({});
    expect(sellerMoneyFields({ askingPrice: "500000" }, true, false)).toMatchObject({ askingPriceCents: 0 });
    expect(sellerMoneyFields({ askingPrice: "500000" }, false, true)).toEqual({ askingPriceCents: 50_000_000 });
  });
});

describe("sellerAdjustmentWrite (t82)", () => {
  const rows = JSON.stringify([
    { type: "owner_salary", amount: "30000", reason: "Sueldo del socio" },
    { type: "one_off", amount: "-5000", reason: "Subvención puntual" },
  ]);

  it("stores a new list as pending, so it does not change the published EBITDA", () => {
    const result = sellerAdjustmentWrite(rows, { ebitdaCents: 10_000_000, rows: null });
    expect(result).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: 10_000_000 } });
    if (result.ok && result.write.kind === "set") {
      expect(result.write.rows.every((row) => row.status === "pending")).toBe(true);
    }
  });

  it("keeps an unchanged approved row in the published figure and ignores a forged approval", () => {
    const stored = [{ id: "6f1c2a40-7b1e-4c1a-9a1a-0b1c2d3e4f50", type: "other" as const, amountCents: 10_000, reason: "Ajuste", status: "approved" as const, documentId: null, documentName: null }];
    const same = JSON.stringify([{ id: stored[0]?.id, type: "other", amount: "100", reason: "Ajuste", status: "approved" }]);
    const edited = JSON.stringify([{ id: stored[0]?.id, type: "other", amount: "250", reason: "Ajuste", status: "approved" }]);
    expect(sellerAdjustmentWrite(same, { ebitdaCents: 0, rows: stored })).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: 10_000 } });
    expect(sellerAdjustmentWrite(edited, { ebitdaCents: 0, rows: stored })).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: 0 } });
  });

  it("ignores a forged total in the posted rows", () => {
    const forged = JSON.stringify([{ type: "other", amount: "100", reason: "Ajuste", adjustedEbitda: "99999999", total: 1, status: "approved" }]);
    const result = sellerAdjustmentWrite(forged, { ebitdaCents: -50_000, rows: null });
    expect(result).toMatchObject({ ok: true, write: { kind: "set", adjustedEbitdaCents: -50_000 } });
  });

  it("keeps a legacy figure when the field is absent or the list stays empty, clears a removed list", () => {
    expect(sellerAdjustmentWrite("", { ebitdaCents: 1, rows: [] })).toEqual({ ok: true, write: { kind: "keep" } });
    expect(sellerAdjustmentWrite("[]", { ebitdaCents: 1, rows: null })).toEqual({ ok: true, write: { kind: "keep" } });
    expect(sellerAdjustmentWrite("[]", { ebitdaCents: 1, rows: [] })).toEqual({ ok: true, write: { kind: "clear" } });
  });

  it("rejects invalid rows", () => {
    expect(sellerAdjustmentWrite('[{"type":"other","amount":"0","reason":"abc"}]', null).ok).toBe(false);
  });

  it("rejects an adjustment larger than revenue and does not write 0 for a pending-only list", () => {
    const huge = JSON.stringify([{ type: "owner_salary", amount: "6000000", reason: "Sueldo del socio" }]);
    expect(sellerAdjustmentWrite(huge, { ebitdaCents: 75_000_000, revenueCents: 500_000_000, rows: null }).ok).toBe(false);
    const pending = JSON.stringify([{ type: "owner_salary", amount: "1000001", reason: "Sueldo del socio" }]);
    expect(sellerAdjustmentWrite(pending, { ebitdaCents: 75_000_000, revenueCents: 500_000_000, rows: null })).toMatchObject({
      ok: true,
      write: { kind: "set", adjustedEbitdaCents: 75_000_000 },
    });
  });
});

describe("declaredAccountsCents", () => {
  it("uses the closed year when the project column is still 0", () => {
    expect(declaredAccountsCents(0, 75_000_000)).toBe(75_000_000);
    expect(declaredAccountsCents(75_000_000, 80_000_000)).toBe(75_000_000);
    expect(declaredAccountsCents(0, null)).toBe(0);
  });
});

describe("t95 ebitdaPublishable", () => {
  it("uses the adjusted EBITDA when an approved list is stored", () => {
    const approved = [{ type: "other", amountCents: 1, reason: "x" }];
    expect(ebitdaPublishable({ ebitdaCents: 500_00, adjustedEbitdaCents: -1_000_00, ebitdaAdjustments: approved })).toBe(false);
    expect(ebitdaPublishable({ ebitdaCents: -500_00, adjustedEbitdaCents: 1_000_00, ebitdaAdjustments: approved })).toBe(true);
    expect(ebitdaPublishable({ ebitdaCents: -500_00, adjustedEbitdaCents: 1_000_00, ebitdaAdjustments: [{ type: "other", amountCents: 1, status: "pending" }] })).toBe(false);
  });
  it("falls back to EBITDA without adjustments", () => {
    expect(ebitdaPublishable({ ebitdaCents: 500_00, adjustedEbitdaCents: 0, ebitdaAdjustments: null })).toBe(true);
    expect(ebitdaPublishable({ ebitdaCents: 500_00, adjustedEbitdaCents: -9, ebitdaAdjustments: [] })).toBe(true);
    expect(ebitdaPublishable({ ebitdaCents: 0, adjustedEbitdaCents: 0, ebitdaAdjustments: null })).toBe(false);
  });
  it("honours a legacy adjusted value with no list", () => {
    expect(ebitdaPublishable({ ebitdaCents: 500_00, adjustedEbitdaCents: -1, ebitdaAdjustments: null })).toBe(false);
  });
});

describe("projectHasPendingAdjustments", () => {
  it("is true only while a stored row waits for Relify", () => {
    expect(projectHasPendingAdjustments({ ebitdaAdjustments: [{ type: "other", amountCents: 1, status: "pending" }] })).toBe(true);
    expect(projectHasPendingAdjustments({ ebitdaAdjustments: [{ type: "other", amountCents: 1, status: "approved" }] })).toBe(false);
    expect(projectHasPendingAdjustments({ ebitdaAdjustments: null })).toBe(false);
  });
});
