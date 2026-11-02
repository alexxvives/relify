import { describe, expect, it } from "vitest";
import { mergeStatementTable } from "./statement-merge";

const row = (key: string, values: Array<number | null>) => ({ key, label: key, emphasis: false, values });

describe("mergeStatementTable", () => {
  it("keeps older stored years next to the form window, form wins on overlap", () => {
    const form = { years: [2023, 2024, 2025].map((year) => ({ year, forecast: false })), rows: [row("sales", [30, 40, null])] };
    const stored = { years: [2021, 2022, 2023].map((year) => ({ year, forecast: false })), rows: [row("sales", [10, 20, 99])] };
    const merged = mergeStatementTable(form, stored);
    expect(merged.years.map((column) => column.year)).toEqual([2021, 2022, 2023, 2024]);
    expect(merged.rows[0]?.values).toEqual([10, 20, 30, 40]);
  });

  it("puts the forecast last and works without stored accounts", () => {
    const form = { years: [{ year: 2026, forecast: true }, { year: 2024, forecast: false }], rows: [row("sales", [5, 4])] };
    expect(mergeStatementTable(form, null).years).toEqual([{ year: 2024, forecast: false }, { year: 2026, forecast: true }]);
  });
});
