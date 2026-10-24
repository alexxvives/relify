"use client";

import { useState } from "react";

export const donutPalettes = {
  blue: ["#163a8a", "#2f5bd0", "#5c7fe0", "#8eaaef", "#c5d4f8"],
  green: ["#0d5c38", "#178a45", "#3dae6a", "#8fd0a8", "#d7f3e4"],
  orange: ["#9a4a08", "#d97706", "#f0a04b", "#f6c98a", "#fde8c8"],
  red: ["#8d2424", "#d64545", "#ee7a7a", "#f4b4b4", "#fbe4e4"],
} as const;

export type DonutPalette = keyof typeof donutPalettes;

export function CountDonut({
  rows,
  palette,
}: {
  rows: { label: string; value: number }[];
  palette: DonutPalette;
}) {
  const colors = donutPalettes[palette];
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const [active, setActive] = useState<number | null>(null);
  const rings = rows.flatMap((row, index) => {
    if (row.value <= 0 || total === 0) {
      return [];
    }

    const length = (row.value / total) * 100;
    const offset = rows.slice(0, index).reduce((sum, item) => sum + (item.value > 0 ? (item.value / total) * 100 : 0), 0);

    return [
      {
        label: row.label,
        length,
        offset,
        color: colors[index % colors.length] ?? "#465ab4",
        index,
      },
    ];
  });

  return (
    <div className="@container mt-4 rounded-xl bg-[#f4f7ff] p-4">
      <div className="grid items-center gap-4 @md:grid-cols-[8rem_minmax(0,1fr)]">
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
              strokeWidth={active === ring.index ? 8 : 6}
              strokeDasharray={ring.length >= 99.9 ? undefined : `${ring.length} ${100 - ring.length}`}
              strokeDashoffset={-ring.offset}
              transform="rotate(-90 21 21)"
              opacity={active === null || active === ring.index ? 1 : 0.35}
              className="cursor-pointer"
              onMouseEnter={() => {
                setActive(ring.index);
              }}
              onMouseLeave={() => {
                setActive(null);
              }}
            />
          ))}
        </svg>
        <ul className="flex min-w-0 flex-col gap-1 text-sm text-[#3d4a63]">
          {rows.map((row, index) => {
            const share = total === 0 ? 0 : Math.round((row.value / total) * 100);
            const color = colors[index % colors.length] ?? "#465ab4";

            return (
              <li
                key={row.label}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onMouseLeave={() => {
                  setActive(null);
                }}
                className={
                  active === index
                    ? "flex items-center justify-between gap-3 rounded-lg bg-white px-2 py-1 font-semibold text-[#1c2740] shadow-sm"
                    : "flex items-center justify-between gap-3 rounded-lg px-2 py-1"
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="min-w-0 break-words">{row.label}</span>
                </span>
                <span className="shrink-0 font-semibold whitespace-nowrap text-[#1c2740] tabular-nums">
                  {row.value}
                  <span className="ml-2 font-medium text-[#667085]">{share} %</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
