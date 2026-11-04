import { describe, expect, it } from "vitest";
import {
  adjustedEbitdaCents,
  adjustmentRowErrors,
  adjustmentRowsValid,
  selectableEbitdaAdjustmentTypes,
  adjustmentsForBuyer,
  parseEbitdaAdjustments,
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
    expect(parsed).toEqual({ ok: true, rows: [{ type: "one_off", amountCents: 100_000, reason: "Litigio cerrado" }] });
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
    expect(rows).toEqual([{ type: "personal", amountCents: 5000, reason: "Coche" }]);
    expect(storedEbitdaAdjustments(null)).toBeNull();
    expect(adjustmentsForBuyer(rows, false)).toEqual([{ type: "personal", amountCents: 5000, reason: null }]);
    expect(adjustmentsForBuyer(rows, true)).toEqual(rows);
  });

  it("t89: offers only predefined types, keeps legacy 'other' readable and flags it in the editor", () => {
    expect(selectableEbitdaAdjustmentTypes).not.toContain("other");
    expect(selectableEbitdaAdjustmentTypes).toContain("one_off_income");
    expect(parseEbitdaAdjustments(JSON.stringify([{ type: "other", amount: "10", reason: "Antiguo" }])).ok).toBe(true);
    expect(adjustmentRowErrors({ type: "other", amount: "10", reason: "Antiguo" })).toEqual({ type: "Elige un tipo de la lista." });
  });

  it("t89: reports each invalid field of a row", () => {
    expect(Object.keys(adjustmentRowErrors({ type: "rent", amount: "", reason: "" }))).toEqual(["amount", "reason"]);
    expect(adjustmentRowErrors({ type: "rent", amount: "0", reason: "Local propio" }).amount).toBe("El importe no puede ser 0.");
    expect(adjustmentRowsValid([{ type: "one_off_income", amount: "-3.500", reason: "Venta de una furgoneta" }])).toBe(true);
    expect(adjustmentRowsValid([])).toBe(true);
  });
});
