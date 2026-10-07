export function CompletionMeter({
  filled,
  total,
  label,
  display = "ratio",
}: {
  filled: number;
  total: number;
  label: string;
  display?: "ratio" | "percent";
}) {
  const complete = total > 0 && filled >= total;
  const amount = total === 0 ? 0 : (filled / total) * 100;
  const figure = display === "percent" ? `${Math.round(amount)}%` : `${filled}/${total}`;
  const tone = complete ? "text-[#17663a]" : "text-[#1c2740]";

  return (
    <div className="mx-auto mt-4 flex w-40 flex-col items-center">
      <svg viewBox="0 0 120 72" className="w-full" aria-hidden>
        <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="#e6e9f0" strokeWidth="10" strokeLinecap="round" />
        {amount > 0 ? (
          <path
            d="M12 62 A48 48 0 0 1 108 62"
            fill="none"
            stroke={complete ? "#17663a" : "#465ab4"}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${amount} 100`}
            className="completion-grow"
          />
        ) : null}
      </svg>
      <p className={`-mt-8 text-2xl font-semibold ${tone}`}>{figure}</p>
      <p className={complete ? "text-xs font-medium text-[#17663a]" : "text-xs text-[#667085]"}>{label}</p>
    </div>
  );
}
