import { marketCopy } from "@/lib/market-copy";
import { formatRecoveryYears, recoveryTone, recoveryYears } from "@/lib/money";

const recoveryClass = {
  good: "text-[#17663a]",
  average: "text-[#c47a12]",
  high: "text-[#c0362c]",
} as const;

export function MarketCardFigures({
  revenue,
  ebitda,
  adjustedEbitda,
  askingPrice,
  askingPriceCents = null,
  ebitdaCents = null,
}: {
  revenue: string;
  ebitda: string;
  adjustedEbitda: string;
  askingPrice: string;
  askingPriceCents?: number | null;
  ebitdaCents?: number | null;
}) {
  const years =
    askingPriceCents === null || ebitdaCents === null ? null : recoveryYears(askingPriceCents, ebitdaCents);
  const row: { label: string; value: string }[] = [
    { label: marketCopy.metrics[0].label, value: revenue },
    { label: marketCopy.metrics[1].label, value: ebitda },
    { label: marketCopy.metrics[2].label, value: adjustedEbitda },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e7eaee]">
      <div className="bg-[#f4f6fb] px-3 py-3 text-center">
        <p className="text-[11px] font-medium tracking-wide text-[#8b95a7] uppercase">{marketCopy.metrics[3].label}</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
          <p className="text-xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{askingPrice}</p>
          {years === null ? null : (
            <p className={`text-xs font-semibold tabular-nums ${recoveryClass[recoveryTone(years)]}`} title={marketCopy.recoveryHint}>
              {formatRecoveryYears(years)}
            </p>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-[#e7eaee]">
        {row.map((item) => (
          <div key={item.label} className="min-w-0 px-1 py-2.5 text-center">
            <dt className="text-[11px] leading-4 text-[#8b95a7]">{item.label}</dt>
            <dd className="mt-1 text-sm leading-5 font-semibold tracking-tight whitespace-nowrap text-[#1c2740] tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
