import { describe, expect, it } from "vitest";
import {
  adjustedEbitdaCents,
  adjustmentRowErrors,
  adjustmentRowsValid,
  selectableEbitdaAdjustmentTypes,
  defaultAdjustmentDirection,
  joinAdjustmentAmount,
  splitAdjustmentAmount,
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

  it("t89: reports each invalid field of a row", () => {
    expect(Object.keys(adjustmentRowErrors({ type: "rent", amount: "", reason: "" }))).toEqual(["amount", "reason"]);
    expect(adjustmentRowErrors({ type: "rent", amount: "0", reason: "Local propio" }).amount).toBe("El importe no puede ser 0.");
    expect(adjustmentRowsValid([{ type: "one_off_income", amount: "-3.500", reason: "Venta de una furgoneta" }])).toBe(true);
    expect(adjustmentRowsValid([])).toBe(true);
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
