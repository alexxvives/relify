import { compactEur } from "@/lib/report-format";
import { companyCopy } from "@/lib/company-copy";
import type { IndicatorUnit, InvestorIndicatorRow } from "@/lib/investor-project";

const decimals = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export function formatIndicator(value: number, unit: IndicatorUnit): string {
  switch (unit) {
    case "percent":
      return `${decimals.format(value)} %`;
    case "multiple":
      return `${decimals.format(value)}x`;
    case "days":
      return `${whole.format(value)} días`;
    case "thousands":
      return compactEur(value * 100_000);
    default:
      return whole.format(value);
  }
}

/** Ratios as SABI computes them (percentages, multiples, days, thousands of EUR per employee). */
export function IndicatorTable({ years, rows }: { years: { year: number }[]; rows: InvestorIndicatorRow[] }) {
  return (
    <div className="layout-table">
      <table className="border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#e6e9f0] text-[#3d34b8]">
            <th className="py-3 pr-4 text-left font-medium">{companyCopy.evolutionLabel}</th>
            {years.map((year) => (
              <th key={year.year} className="px-3 py-3 text-right font-medium">
                {year.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-[#e6e9f0]">
              <th className="py-3 pr-4 text-left font-medium text-[#3d4a63]">{row.label}</th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.key}-${years[index]?.year ?? index}`}
                  className={value !== null && value < 0 ? "px-3 py-3 text-right tabular-nums text-[#9b3b2f]" : "px-3 py-3 text-right tabular-nums"}
                >
                  {value === null ? companyCopy.unavailable : formatIndicator(value, row.unit)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
