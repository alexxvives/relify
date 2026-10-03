import { companyCopy } from "@/lib/company-copy";
import { formatEur } from "@/lib/money";

export function FinancialTable({
  years,
  rows,
}: {
  years: { year: number; forecast: boolean }[];
  rows: { key: string; label: string; emphasis: boolean; values: Array<number | null> }[];
}) {
  if (years.length === 0) {
    return <p className="text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#e6e9f0] text-[#3d34b8]">
            <th className="py-3 pr-4 text-left font-medium">{companyCopy.evolutionLabel}</th>
            {years.map((year) => (
              <th key={`${year.forecast ? "forecast" : "closed"}-${year.year}`} className="px-3 py-3 text-right font-medium">
                {year.forecast ? `${companyCopy.forecastMark} ${year.year}` : year.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-[#e6e9f0]">
              <th className={row.emphasis ? "py-3 pr-4 text-left font-semibold" : "py-3 pr-4 text-left font-medium"}>
                {row.label}
              </th>
              {row.values.map((value, index) => {
                const column = years[index];
                return (
                  <td
                    key={`${row.key}-${column?.year ?? index}`}
                    className={row.emphasis ? "px-3 py-3 text-right font-semibold" : "px-3 py-3 text-right"}
                  >
                    {value === null ? companyCopy.unavailable : formatEur(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
