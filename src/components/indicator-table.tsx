import { AlignedColumns, MiniTrend } from "@/components/financial-table";
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
export function IndicatorTable({ years, rows, aligned = false }: { years: { year: number }[]; rows: InvestorIndicatorRow[]; /** t81: same columns as the aligned FinancialTable (Tendencia, blank share column: a ratio has no share). */ aligned?: boolean }) {
  return (
    <div className="layout-table">
      <table className={aligned ? "w-full! min-w-[min(44rem,100vw)] sm:min-w-[44rem] table-fixed border-collapse text-sm [&_td]:whitespace-nowrap" : "border-collapse text-sm"}>
        {aligned ? <AlignedColumns years={years.length} /> : null}
        <thead>
          <tr className="border-b border-[#e6e9f0] text-[#3d34b8]">
            <th className={`py-3 pr-4 text-left font-medium ${aligned ? "font-semibold text-[#1c2740]" : ""}`}>{companyCopy.evolutionLabel}</th>
            {years.map((year, index) => (
              <th key={`${index}-${year.year}`} className="px-3 py-3 text-right font-medium">
                {year.year}
              </th>
            ))}
            {aligned ? (
              <>
                <th className="px-3 py-3 text-center font-medium">Tendencia</th>
                <th />
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-[#e6e9f0]">
              <th className="py-3 pr-4 text-left font-medium text-[#3d4a63]">{row.label}</th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.key}-${index}`}
                  className={value !== null && value < 0 ? "px-3 py-3 text-right tabular-nums text-[#9b3b2f]" : "px-3 py-3 text-right tabular-nums"}
                >
                  {value === null ? companyCopy.unavailable : formatIndicator(value, row.unit)}
                </td>
              ))}
              {aligned ? (
                <>
                  <td className="px-3 py-2 text-center">
                    <MiniTrend values={row.values} />
                  </td>
                  <td />
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
