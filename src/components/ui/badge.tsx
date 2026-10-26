/** Shared notification badges: a numeric bubble and a plain red dot. */

const countSize = {
  xs: "h-3.5 min-w-3.5 px-[3px] text-[9px]",
  sm: "h-4 min-w-4 px-1 text-[10px]",
  md: "h-5 min-w-5 px-1.5 text-xs",
} as const;

const countTone = {
  alert: "bg-public-clay text-white",
  brand: "bg-[#465ab4] text-white",
} as const;

export function CountBadge({
  count,
  max = 9,
  size = "sm",
  tone = "alert",
  ring = false,
  className = "",
  label,
}: {
  count: number;
  max?: number;
  size?: keyof typeof countSize;
  tone?: keyof typeof countTone;
  ring?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full leading-none font-semibold tabular-nums ${countSize[size]} ${countTone[tone]} ${ring ? "ring-2 ring-white" : ""} ${className}`}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

export function AlertDot({ className = "", ring = false, label }: { className?: string; ring?: boolean; label?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex size-2.5 shrink-0 rounded-full bg-[#d92d20] ${ring ? "ring-2 ring-white" : ""} ${className}`}
    />
  );
}
