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
      <div className="flex items-baseline justify-between gap-3 bg-[#f4f6fb] px-4 py-3">
        <p className="text-xs font-medium text-[#8b95a7]">{marketCopy.metrics[3].label}</p>
        <div className="flex min-w-0 items-baseline gap-2">
          {years === null ? null : (
            <p className={`text-xs font-semibold whitespace-nowrap tabular-nums ${recoveryClass[recoveryTone(years)]}`} title={marketCopy.recoveryHint}>
              {formatRecoveryYears(years)}
            </p>
          )}
          <p className="text-[22px] leading-7 font-semibold tracking-tight whitespace-nowrap text-[#1c2740] tabular-nums">{askingPrice}</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-[#e7eaee] border-t border-[#e7eaee]">
        {row.map((item) => (
          <div key={item.label} className="min-w-0 px-2 py-2.5 text-center">
            <dt className="truncate text-[11px] font-medium text-[#8b95a7]" title={item.label}>
              {item.label}
            </dt>
            <dd className="mt-0.5 text-[15px] font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
