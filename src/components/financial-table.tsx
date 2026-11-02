import { companyCopy } from "@/lib/company-copy";
import { formatEur } from "@/lib/money";

export function FinancialTable({
  years: allYears,
  rows: allRows,
  trend = false,
  shareOf,
  title,
  aligned = false,
  shareBase,
  grid = false,
}: {
  years: { year: number; forecast: boolean }[];
  rows: { key: string; label: string; emphasis: boolean; values: Array<number | null> }[];
  /** t70: adds a sparkline column so the eye reads the direction of each row. */
  trend?: boolean;
  /** t70: row whose last closed value is the 100 % base for a "% sobre" column with a mini bar. */
  shareOf?: { key: string; label: string };
  /** t80: header label of the first column (defaults to "Evolución financiera"). */
  title?: string;
  /** t80: full-width fixed layout so stacked tables line their year columns up. */
  aligned?: boolean;
  /** t81: base taken from another table (e.g. ingresos for the result/working-capital lines), one value per year. */
  shareBase?: { label: string; values: Array<number | null> };
  /** t81: Detalle de cuentas grid: aligned plus fixed year, Tendencia and share columns, blank where they do not apply. */
  grid?: boolean;
}) {
  // t79/t80: a year column with no figures at all (e.g. an unfiled 2025, or an empty forecast) is hidden.
  const filled = allYears.map((_, index) => allRows.some((row) => row.values[index] != null));
  const keep = filled.some(Boolean) ? filled : allYears.map((year) => !year.forecast);
  const years = allYears.filter((_, index) => keep[index]);
  const rows = allRows.map((row) => ({ ...row, values: row.values.filter((_, index) => keep[index]) }));
  const baseValues = shareBase ? shareBase.values.filter((_, index) => keep[index]) : shareOf ? rows.find((row) => row.key === shareOf.key)?.values : undefined;
  const baseIndex = baseValues ? lastClosedIndex(years, baseValues) : -1;
  const base = baseIndex >= 0 ? baseValues![baseIndex]! : null;
  const shareLabel = shareBase?.label ?? shareOf?.label ?? "";
  // t81: aligned tables always keep the Tendencia and share columns (blank when they do not apply).
  const showTrend = trend || grid;
  const showShare = base !== null || grid;
  if (years.length === 0) {
    return <p className="text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>;
  }

  return (
    <div className="layout-table">
      <table
        className={
          grid ? "w-full! min-w-[44rem] table-fixed border-collapse text-sm [&_td]:whitespace-nowrap" : aligned ? "w-full! min-w-[30rem] table-fixed border-collapse text-sm [&_td]:whitespace-nowrap" : "border-collapse text-sm"
        }
      >
        {grid ? <AlignedColumns years={years.length} /> : null}
        <thead>
          <tr className="border-b border-[#e6e9f0] text-[#3d34b8]">
            <th className={`py-3 pr-4 text-left font-medium ${grid ? "font-semibold text-[#1c2740]" : aligned ? "w-[44%] font-semibold text-[#1c2740]" : ""}`}>{title ?? companyCopy.evolutionLabel}</th>
            {years.map((year) => (
              <th
                key={`${year.forecast ? "forecast" : "closed"}-${year.year}`}
                className={year.forecast ? "bg-[#fff8db] px-3 py-3 text-right font-medium" : "px-3 py-3 text-right font-medium"}
              >
                {year.forecast ? `${companyCopy.forecastMark} ${year.year}` : year.year}
              </th>
            ))}
            {showTrend ? <th className="px-3 py-3 text-center font-medium">{trend ? "Tendencia" : ""}</th> : null}
            {showShare ? (
              <th className="px-3 py-3 text-left font-medium whitespace-nowrap">{base !== null ? `% s/ ${shareLabel} ${years[baseIndex]?.year}` : ""}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.emphasis ? "border-b border-[#d7eee2] bg-[#f3faf6]" : "border-b border-[#e6e9f0]"}>
              <th className={row.emphasis ? "py-3 pr-4 text-left font-semibold text-[#17663a]" : "py-3 pr-4 text-left font-medium text-[#3d4a63]"}>
                {row.label}
              </th>
              {row.values.map((value, index) => {
                const column = years[index];
                return (
                  <td key={`${row.key}-${column?.year ?? index}`} className={amountClass(row.emphasis, column?.forecast === true, value)}>
                    {value === null ? companyCopy.unavailable : formatEur(value)}
                  </td>
                );
              })}
              {showTrend ? <td className="px-3 py-2 text-center">{trend ? <MiniTrend values={row.values} /> : null}</td> : null}
              {base !== null ? <ShareCell value={row.values[baseIndex] ?? null} base={base} /> : showShare ? <td /> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** t81: shared widths for every aligned table: label takes the rest, then years, Tendencia and the share column. */
export function AlignedColumns({ years }: { years: number }) {
  return (
    <colgroup>
      <col />
      {Array.from({ length: years }, (_, index) => (
        <col key={index} className="w-[7.5rem]" />
      ))}
      <col className="w-[6rem]" />
      <col className="w-[10.5rem]" />
    </colgroup>
  );
}

function amountClass(emphasis: boolean, forecast: boolean, value: number | null): string {
  const parts = ["px-3 py-3 text-right tabular-nums"];

  if (emphasis) {
    parts.push("font-semibold");
  }

  if (forecast) {
    parts.push("bg-[#fff8db]");
  }

  if (value !== null && value < 0) {
    parts.push("text-[#9b3b2f]");
  }

  return parts.join(" ");
}

function lastClosedIndex(years: { forecast: boolean }[], values: Array<number | null>): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (years[index]?.forecast !== true && value !== null && value !== undefined && value > 0) {
      return index;
    }
  }
  return -1;
}

/** Plain SVG sparkline, no hooks, so the table stays server-renderable. */
export function MiniTrend({ values }: { values: Array<number | null> }) {
  const points = values.flatMap((value, index) => (value === null ? [] : [{ index, value }]));
  if (points.length < 2) {
    return <span className="text-[#c3c9d3]">—</span>;
  }
  const min = Math.min(0, ...points.map((point) => point.value));
  const max = Math.max(0, ...points.map((point) => point.value));
  const span = max - min || 1;
  const width = 64;
  const height = 20;
  const x = (index: number) => (values.length === 1 ? width / 2 : (index / (values.length - 1)) * (width - 4) + 2);
  const y = (value: number) => height - 2 - ((value - min) / span) * (height - 4);
  const first = points[0]!.value;
  const last = points[points.length - 1]!.value;
  const color = last >= first ? "#0f766e" : "#a12f2f";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="inline-block h-5 w-16" aria-label={last >= first ? "Sube" : "Baja"} role="img">
      {min < 0 ? <line x1="0" x2={width} y1={y(0)} y2={y(0)} stroke="#e3e7ed" strokeWidth="1" /> : null}
      <polyline points={points.map((point) => `${x(point.index)},${y(point.value)}`).join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points[points.length - 1]!.index)} cy={y(last)} r="1.8" fill={color} />
    </svg>
  );
}

function ShareCell({ value, base }: { value: number | null; base: number }) {
  if (value === null) {
    return <td className="px-3 py-2 text-[#c3c9d3]">—</td>;
  }
  const pct = (value / base) * 100;
  const width = Math.min(100, Math.abs(pct));
  return (
    <td className="px-3 py-2">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[#eef0f4]">
          <span className={`block h-full rounded-full ${pct < 0 ? "bg-[#d98080]" : "bg-[#2fc4b2]"}`} style={{ width: `${width}%` }} />
        </span>
        <span className={`text-xs tabular-nums ${pct < 0 ? "text-[#a12f2f]" : "text-[#3d4a63]"}`}>{pct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span>
      </span>
    </td>
  );
}
