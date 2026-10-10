export function CountDonut({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const rings: { label: string; color: string; length: number; offset: number }[] = [];
  let offset = 0;

  for (const row of rows) {
    if (row.value <= 0 || total === 0) {
      continue;
    }

    const length = (row.value / total) * 100;
    rings.push({ label: row.label, color: row.color, length, offset });
    offset += length;
  }

  return (
    <div className="mt-4 grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <svg viewBox="0 0 42 42" className="mx-auto h-auto w-full max-w-36" aria-hidden="true">
        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#e6e9f0" strokeWidth="6" />
        {rings.map((ring) => (
          <circle
            key={ring.label}
            cx="21"
            cy="21"
            r="15.9155"
            fill="transparent"
            stroke={ring.color}
            strokeWidth="6"
            strokeDasharray={ring.length >= 99.9 ? undefined : `${ring.length} ${100 - ring.length}`}
            strokeDashoffset={-ring.offset}
            transform="rotate(-90 21 21)"
          />
        ))}
      </svg>
      <ul className="flex flex-col gap-2 text-sm text-[#3d4a63]">
        {rows.map((row) => {
          const share = total === 0 ? 0 : Math.round((row.value / total) * 100);

          return (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="font-semibold text-[#1c2740] tabular-nums">
                {row.value}
                <span className="ml-2 font-medium text-[#667085]">{share} %</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CountBars({
  rows,
  funnel = false,
}: {
  rows: { label: string; value: number }[];
  funnel?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="mt-4 flex flex-col gap-4">
      {rows.map((row) => {
        const width = (row.value / max) * 100;

        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[#3d4a63]">{row.label}</span>
              <span className="font-semibold text-[#1c2740] tabular-nums">{row.value}</span>
            </div>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-1 block h-2 w-full" aria-hidden="true">
              {funnel ? (
                <rect x={(100 - width) / 2} y="0" width={Math.max(width, 0)} height="8" rx="4" fill="#465ab4" />
              ) : (
                <>
                  <rect x="0" y="0" width="100" height="8" rx="4" fill="#e6e9f0" />
                  <rect x="0" y="0" width={Math.max(width, 0)} height="8" rx="4" fill="#465ab4" />
                </>
              )}
            </svg>
          </li>
        );
      })}
    </ul>
  );
}
