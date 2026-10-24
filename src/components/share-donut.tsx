"use client";

import { useState } from "react";
import { companyCopy } from "@/lib/company-copy";
import { formatBasisPoints, type SliceKind } from "@/lib/company-profile";

const palettes: Record<SliceKind, readonly string[]> = {
  client: ["#1b7a45", "#8fd0a8", "#0f4d2c", "#d4f0e0"],
  product: ["#e07a3d", "#f6c7a4", "#b85a22", "#fbe4d4"],
  capital: ["#c23b3b", "#f0a3a3", "#8d2424", "#f8d6d6"],
};

export function ShareDonut({
  title,
  slices,
  palette,
}: {
  title: string;
  slices: { label: string; basisPoints: number }[];
  palette: SliceKind;
}) {
  const colors = palettes[palette];
  const [active, setActive] = useState<number | null>(null);
  const rings = slices.map((slice, index) => ({
    label: slice.label,
    detail: formatBasisPoints(slice.basisPoints),
    length: slice.basisPoints / 100,
    offset: slices.slice(0, index).reduce((sum, item) => sum + item.basisPoints / 100, 0),
    color: colors[index % colors.length] ?? "#465ab4",
  }));

  return (
    <section className="@container flex h-full min-h-40 flex-col rounded-xl bg-[#f4f7ff] p-4">
      <h3 className="text-sm font-semibold text-[#1c2740]">{title}</h3>
      {slices.length === 0 ? (
        <p className="mt-3 text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-3 py-2 @[18rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 42 42" className="h-auto w-24 @[18rem]:w-36" aria-hidden="true">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#e6e9f0" strokeWidth="6" />
              {rings.map((ring, index) => (
                <circle
                  key={ring.label}
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="transparent"
                  stroke={ring.color}
                  strokeWidth={active === index ? 8 : 6}
                  strokeDasharray={`${ring.length} ${100 - ring.length}`}
                  strokeDashoffset={-ring.offset}
                  transform="rotate(-90 21 21)"
                  opacity={active === null || active === index ? 1 : 0.35}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    setActive(index);
                  }}
                  onMouseLeave={() => {
                    setActive(null);
                  }}
                />
              ))}
            </svg>
          </div>
          <ul className="flex min-w-0 flex-col gap-1 text-xs text-[#3d4a63]">
            {rings.map((ring, index) => (
              <li
                key={ring.label}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onMouseLeave={() => {
                  setActive(null);
                }}
                className={
                  active === index
                    ? "flex items-start gap-2 rounded-lg bg-white px-2 py-1 font-semibold text-[#1c2740] shadow-sm"
                    : "flex items-start gap-2 rounded-lg px-2 py-1"
                }
              >
                <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ring.color }} />
                <span className="min-w-0 break-words">
                  {ring.label}
                  <span className="mt-0.5 block font-medium text-[#1c2740]">{ring.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
