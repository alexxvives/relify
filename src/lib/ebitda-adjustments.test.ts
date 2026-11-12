import { describe, expect, it } from "vitest";
import {
  adjustedEbitdaCents,
  adjustmentExceedsHalfEbitda,
  adjustmentExceedsRevenue,
  adjustmentRowErrors,
  adjustmentRowsValid,
  selectableEbitdaAdjustmentTypes,
  defaultAdjustmentDirection,
  joinAdjustmentAmount,
  splitAdjustmentAmount,
  adjustmentsForBuyer,
  formRowsFromJson,
  formRowsToJson,
  parseEbitdaAdjustments,
  pendingAdjustments,
  publishedEbitdaFromAdjustments,
  storedEbitdaAdjustments,
  sumEbitdaAdjustments,
} from "./ebitda-adjustments";

describe("ebitda adjustments", () => {
  it("adds signed adjustments to the accounts EBITDA", () => {
    const parsed = parseEbitdaAdjustments(
      JSON.stringify([
        { type: "owner_salary", amount: "40000", reason: "Sueldo del fundador" },
        { type: "rent", amount: "-12000,50", reason: "Local propio sin alquiler" },
      ]),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows.map((row) => row.amountCents)).toEqual([4_000_000, -1_200_050]);
    expect(sumEbitdaAdjustments(parsed.rows)).toBe(2_799_950);
    expect(adjustedEbitdaCents(-11_000_000, parsed.rows)).toBe(-8_200_050);
  });

  it("ignores a client-sent total and other unknown keys", () => {
    const parsed = parseEbitdaAdjustments(
      JSON.stringify([{ type: "one_off", amount: "1000", reason: "Litigio cerrado", total: "999999999", amountCents: 1 }]),
    );
    expect(parsed).toEqual({
      ok: true,
      rows: [{ id: null, type: "one_off", amountCents: 100_000, reason: "Litigio cerrado", documentId: null, documentName: null }],
    });
    if (parsed.ok) expect(adjustedEbitdaCents(500_000, parsed.rows)).toBe(600_000);
  });

  it("rejects bad rows", () => {
    expect(parseEbitdaAdjustments("nope").ok).toBe(false);
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "x", amount: "1", reason: "abc" }])).ok).toBe(false);
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "other", amount: "1.000", reason: "abc" }])).ok).toBe(false);
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "other", amount: "0", reason: "abc" }])).ok).toBe(false);
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "other", amount: "10", reason: "" }])).ok).toBe(false);
    expect(parseEbitdaAdjustments("")).toEqual({ ok: true, rows: [] });
  });

  it("reads stored rows defensively and hides reasons before the NDA", () => {
    const rows = storedEbitdaAdjustments([{ type: "personal", amountCents: 5000, reason: "Coche" }, { type: "bad" }, null]);
    expect(rows).toEqual([
      { id: "legacy-0", type: "personal", amountCents: 5000, reason: "Coche", status: "approved", documentId: null, documentName: null },
    ]);
    expect(storedEbitdaAdjustments(null)).toBeNull();
    expect(adjustmentsForBuyer(rows, false)).toEqual([
      { id: "legacy-0", type: "personal", amountCents: 5000, reason: null, status: "approved", documentId: null, documentName: null },
    ]);
    expect(adjustmentsForBuyer(rows, true)).toEqual(rows);
    const pending = storedEbitdaAdjustments([{ id: "6f1c2a40-7b1e-4c1a-9a1a-0b1c2d3e4f50", type: "other", amountCents: 100, reason: "Nuevo", status: "pending", documentId: "6f1c2a40-7b1e-4c1a-9a1a-0b1c2d3e4f51", documentName: "soporte.pdf" }]);
    expect(adjustmentsForBuyer(pending, true)).toEqual([]);
    expect(pendingAdjustments(pending ?? []).length).toBe(1);
  });

  it("t91: offers 'Otro' again and still requires a justification for every type", () => {
    expect(selectableEbitdaAdjustmentTypes).toContain("other");
    expect(selectableEbitdaAdjustmentTypes).toContain("one_off_income");
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "other", amount: "10", reason: "Antiguo" }])).ok).toBe(true);
    expect(adjustmentRowErrors({ type: "other", amount: "10", reason: "Antiguo" })).toEqual({});
    expect(adjustmentRowErrors({ type: "other", amount: "10", reason: "" }).reason).toBeDefined();
  });

  it("t91: cost/income direction round-trips through the signed amount", () => {
    expect(splitAdjustmentAmount("-1200", "one_off")).toEqual({ direction: "income", amount: "1200" });
    expect(splitAdjustmentAmount("1200", "one_off_income")).toEqual({ direction: "cost", amount: "1200" });
    expect(splitAdjustmentAmount("", "one_off_income")).toEqual({ direction: "income", amount: "" });
    expect(splitAdjustmentAmount("", "personal")).toEqual({ direction: "cost", amount: "" });
    expect(joinAdjustmentAmount("1200", "income")).toBe("-1200");
    expect(joinAdjustmentAmount("1200", "cost")).toBe("1200");
    expect(joinAdjustmentAmount("", "income")).toBe("-");
    expect(splitAdjustmentAmount("-", "personal")).toEqual({ direction: "income", amount: "" });
    expect(defaultAdjustmentDirection("one_off_income")).toBe("income");
  });

  it("treats a form row with no status as approved, matching stored legacy rows", () => {
    const rows = formRowsFromJson(JSON.stringify([{ type: "other", amount: "500", reason: "Extraordinario" }]));
    expect(rows[0]?.status).toBe("approved");
    const pending = formRowsFromJson(JSON.stringify([{ type: "other", amount: "500", reason: "Extraordinario", status: "pending" }]));
    expect(pending[0]?.status).toBe("pending");
  });

  it("keeps pending status when the form JSON round-trips, so a 1 M owner_salary in review is not treated as approved", () => {
    const stored = [
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", type: "one_off" as const, amount: "50000", reason: "Extraordinario aprobado", status: "approved" as const, documentId: "", documentName: "" },
      { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", type: "owner_salary" as const, amount: "1000001", reason: "Sueldo del propietario", status: "pending" as const, documentId: "", documentName: "" },
    ];
    const json = formRowsToJson(stored);
    expect(json).toContain('"status":"pending"');
    expect(formRowsFromJson(json).map((row) => row.status)).toEqual(["approved", "pending"]);
  });

  it("t89: reports each invalid field of a row", () => {
    expect(Object.keys(adjustmentRowErrors({ type: "rent", amount: "", reason: "" }))).toEqual(["amount", "reason"]);
    expect(adjustmentRowErrors({ type: "rent", amount: "0", reason: "Local propio" }).amount).toBe("El importe no puede ser 0.");
    expect(adjustmentRowsValid([{ type: "one_off_income", amount: "-3.500", reason: "Venta de una furgoneta" }])).toBe(true);
    expect(adjustmentRowsValid([])).toBe(true);
  });

  it("rejects an adjustment larger than that year's sales", () => {
    expect(adjustmentExceedsRevenue(100_000_100, 500_000_000)).toBe(false);
    expect(adjustmentExceedsRevenue(600_000_000, 500_000_000)).toBe(true);
    expect(
      parseEbitdaAdjustments(JSON.stringify([{ type: "owner_salary", amount: "6000000", reason: "Sueldo del socio" }]), {
        revenueCents: 500_000_000,
      }).ok,
    ).toBe(false);
    expect(adjustmentRowErrors({ type: "owner_salary", amount: "6000000", reason: "Sueldo del socio" }, { revenueCents: 500_000_000 }).amount).toBeDefined();
  });

  it("allows 1 M € on 5 M sales even when the amount is more than half of EBITDA", () => {
    expect(adjustmentExceedsRevenue(100_000_100, 500_000_000)).toBe(false);
    expect(adjustmentExceedsHalfEbitda(100_000_100, 75_000_000)).toBe(true);
    expect(adjustmentExceedsHalfEbitda(5_000_000, 75_000_000)).toBe(false);
    expect(
      parseEbitdaAdjustments(JSON.stringify([{ type: "owner_salary", amount: "1000001", reason: "Sueldo del socio" }]), {
        revenueCents: 500_000_000,
      }).ok,
    ).toBe(true);
    expect(
      adjustmentRowsValid([{ type: "owner_salary", amount: "1000001", reason: "Sueldo del socio" }], {
        revenueCents: 500_000_000,
        ebitdaCents: 75_000_000,
      }),
    ).toBe(true);
  });
});

describe("publishedEbitdaFromAdjustments", () => {
  const pendingSalary = {
    id: "legacy-0",
    type: "owner_salary" as const,
    amountCents: 100_000_100,
    reason: "Sueldo",
    status: "pending" as const,
    documentId: null,
    documentName: null,
  };
  const approved = {
    id: "legacy-1",
    type: "one_off" as const,
    amountCents: 5_000_000,
    reason: "Extra",
    status: "approved" as const,
    documentId: null,
    documentName: null,
  };

  it("keeps declared EBITDA when the only row is pending, even if the stored column is 0", () => {
    const shown = publishedEbitdaFromAdjustments(75_000_000, [pendingSalary], 0, 500_000_000);
    expect(shown.hasApproved).toBe(false);
    expect(shown.hasPending).toBe(true);
    expect(shown.adjustedEbitdaCents).toBe(75_000_000);
  });

  it("adds only approved rows when a pending owner_salary sits next to them", () => {
    const shown = publishedEbitdaFromAdjustments(75_000_000, [approved, pendingSalary], 0, 500_000_000);
    expect(shown.hasApproved).toBe(true);
    expect(shown.adjustedEbitdaCents).toBe(80_000_000);
  });

  it("does not apply an approved row larger than revenue", () => {
    const oversized = { ...approved, amountCents: 600_000_000 };
    const shown = publishedEbitdaFromAdjustments(75_000_000, [oversized], 0, 500_000_000);
    expect(shown.hasApproved).toBe(false);
    expect(shown.adjustedEbitdaCents).toBe(75_000_000);
  });

  it("does not treat a copied accounts figure as a legacy approved adjustment", () => {
    const shown = publishedEbitdaFromAdjustments(75_000_000, null, 75_000_000, 500_000_000);
    expect(shown.hasApproved).toBe(false);
    expect(shown.adjustedEbitdaCents).toBe(75_000_000);
  });
});

describe("adjustedEbitdaTone (t92)", () => {
  it("red below, green above, neutral when equal", async () => {
    const { adjustedEbitdaTone } = await import("./ebitda-adjustments");
    expect(adjustedEbitdaTone(100, 90)).toBe("down");
    expect(adjustedEbitdaTone(100, 120)).toBe("up");
    expect(adjustedEbitdaTone(100, 100)).toBe("flat");
  });
});
