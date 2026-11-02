import type { InvestorStatementRow, InvestorYearColumn } from "./investor-project";

export type StatementTable = { years: InvestorYearColumn[]; rows: InvestorStatementRow[] };

/**
 * t83: the seller form only edits a fixed window of recent years, so the preview tables lost the
 * older stored years (2021-2022) that the charts and ratios still showed. Merge both: a year the
 * form has figures for wins; every other stored year is kept. Empty columns are dropped, closed
 * years go oldest first and the forecast last.
 */
export function mergeStatementTable(form: StatementTable, stored: StatementTable | null): StatementTable {
  const columns = new Map<string, { column: InvestorYearColumn; values: Map<string, number | null> }>();
  const add = (table: StatementTable, override: boolean) => {
    table.years.forEach((column, index) => {
      const values = new Map(table.rows.map((row) => [row.key, row.values[index] ?? null]));
      if (![...values.values()].some((value) => value !== null)) {
        return;
      }
      const id = `${column.year}-${column.forecast ? "f" : "c"}`;
      if (override || !columns.has(id)) {
        columns.set(id, { column, values });
      }
    });
  };
  if (stored) {
    add(stored, false);
  }
  add(form, true);
  const ordered = [...columns.values()].sort(
    (left, right) => Number(left.column.forecast) - Number(right.column.forecast) || left.column.year - right.column.year,
  );
  const template = form.rows.length > 0 ? form.rows : (stored?.rows ?? []);
  return {
    years: ordered.map((entry) => entry.column),
    rows: template.map((row) => ({ ...row, values: ordered.map((entry) => entry.values.get(row.key) ?? null) })),
  };
}
