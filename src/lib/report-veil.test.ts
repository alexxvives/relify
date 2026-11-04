import { describe, expect, it } from "vitest";
import { buyerProjectView, veilYears } from "./report-veil";
import { figureVeilYears } from "./figure-veil";

describe("veilYears (t91)", () => {
  it("keeps the shape (years, nulls, ratio keys) and never the real figures", () => {
    const real = { ...figureVeilYears()[0]!, year: 2024, revenueCents: 123_456, ebitdaCents: null, ratios: { roa: 3.3 } };
    const [fake] = veilYears([real]);
    expect(fake!.year).toBe(2024);
    expect(fake!.ebitdaCents).toBeNull();
    expect(fake!.revenueCents).not.toBe(123_456);
    expect(Object.keys(fake!.ratios)).toEqual(["roa"]);
    expect(fake!.ratios.roa).not.toBe(3.3);
  });
});

describe("buyerProjectView (t91-sec)", () => {
  const year = { ...figureVeilYears()[0]!, year: 2024, revenueCents: 777_111_01, cashCents: 333_222_01, equityCents: 444_555_01, employees: 37, ratios: { roa: 12.34 } };
  const row = { label: "Ventas", values: [777_111_01, null] };
  const project = {
    slug: "p",
    codename: "Proyecto P",
    revenueCents: 1_000_00,
    askingPriceCents: 2_000_00,
    ebitdaAdjustments: [{ type: "other", amountCents: 5_000_00, reason: "Motivo secreto" }],
    reportYears: [year],
    incomeRows: [row],
    balanceRows: [row],
    detailRows: [row],
    indicatorRows: [{ label: "ROA", values: [12.34] }],
    capital: [{ label: "Socio A", basisPoints: 6123 }],
    products: [{ label: "Producto X", basisPoints: 7123 }],
    clients: [{ label: "Cliente Y", basisPoints: 8123 }],
    secondaryCnaes: [],
  } as unknown as Parameters<typeof buyerProjectView>[0];

  it("before the NDA the payload carries no real locked value", () => {
    const text = JSON.stringify(buyerProjectView(project, false));
    for (const secret of ["77711101", "33322201", "44455501", "12.34", "6123", "7123", "8123", "Motivo secreto", "Socio A", "Producto X", "Cliente Y"]) {
      expect(text).not.toContain(secret);
    }
    expect(buyerProjectView(project, false).reportYears![0]!.employees).not.toBe(37);
    // public deal facts stay
    expect(text).toContain("100000");
    expect(text).toContain("200000");
  });

  it("after the NDA the profile is unchanged", () => {
    expect(buyerProjectView(project, true)).toEqual(project);
  });
});
