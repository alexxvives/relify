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
      <div className="bg-[#f4f6fb] px-4 py-4 text-center">
        <p className="text-xs font-medium tracking-wide text-[#8b95a7] uppercase">{marketCopy.metrics[3].label}</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
          <p className="text-[26px] leading-8 font-semibold tracking-tight text-[#1c2740] tabular-nums">{askingPrice}</p>
          {years === null ? null : (
            <p className={`text-xs font-semibold tabular-nums ${recoveryClass[recoveryTone(years)]}`} title={marketCopy.recoveryHint}>
              {formatRecoveryYears(years)}
            </p>
          )}
        </div>
      </div>
      <dl className="divide-y divide-[#e7eaee] border-t border-[#e7eaee]">
        {row.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="text-sm text-[#667085]">{item.label}</dt>
            <dd className="text-base font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
