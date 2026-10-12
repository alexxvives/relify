"use client";

import { useState } from "react";
import { donutPalettes, type DonutPalette } from "@/components/admin-charts";
import { adminCopy } from "@/lib/admin-copy";
import { formatCompactEur } from "@/lib/money";
import type { AdminBilling, BillingBook, BillingEntry } from "@/server/getAdminBilling";

const bookPalette: Record<string, DonutPalette> = {
  subscriptions: "blue",
  listings: "orange",
  deposits: "green",
  closes: "red",
  "advisor-fees": "blue",
  quotes: "orange",
};

export function AdminBilling({ billing }: { billing: AdminBilling }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {billing.books.map((book) => (
        <BillingSource key={book.id} book={book} />
      ))}
    </div>
  );
}

function BillingSource({ book }: { book: BillingBook }) {
  const [open, setOpen] = useState(false);
  const color = donutPalettes[bookPalette[book.id] ?? "blue"][0];

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#1c2740]">{book.title}</h2>
          <p className="mt-1 text-sm text-[#667085]">{book.note}</p>
        </div>
        <p className="shrink-0 text-right text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{book.total}</p>
      </div>
      {book.entries.length === 0 ? (
        <p className="mt-4 text-sm text-[#667085]">{adminCopy.billingNone}</p>
      ) : (
        <>
          <SourceChart entries={book.entries} color={color} label={book.title} />
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              setOpen((current) => !current);
            }}
            className="mt-3 text-sm font-medium text-[#465ab4]"
          >
            {open ? adminCopy.billingHide : adminCopy.billingShow}
            {` · ${book.count}`}
          </button>
          {open ? (
            <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {book.entries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f8fb] px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1c2740]">{entry.title}</p>
                    <p className="mt-0.5 text-xs text-[#667085]">{entry.detail}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#1c2740] tabular-nums">{entry.amount}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}

function SourceChart({ entries, color, label }: { entries: BillingEntry[]; color: string; label: string }) {
  const vertical = entries.length > 4;
  const padLeft = 78;
  const padRight = 16;
  const padTop = 12;
  const plotHeight = 112;
  const padBottom = vertical ? 120 : 28;
  const height = padTop + plotHeight + padBottom;
  const slot = vertical ? 28 : 96;
  const width = Math.max(480, padLeft + entries.length * slot + padRight);
  const plotWidth = width - padLeft - padRight;
  const ticks = euroTicks(Math.max(...entries.map((entry) => entry.cents), 0));
  const scaleMax = Math.max(...ticks);
  const axisY = padTop + plotHeight;
  const yOf = (cents: number) => (scaleMax <= 0 ? axisY : padTop + ((scaleMax - cents) / scaleMax) * plotHeight);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full font-sans"
        style={{ aspectRatio: `${width} / ${height}`, minWidth: vertical ? width : undefined }}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <line x1={padLeft} x2={padLeft} y1={padTop} y2={axisY} stroke="#c5cdd8" />
        <line x1={padLeft} x2={width - padRight} y1={axisY} y2={axisY} stroke="#c5cdd8" />
        {ticks.map((tick, index) => {
          const y = yOf(tick);
          return (
            <g key={`${tick}-${index}`}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke={tick === 0 ? "#c5cdd8" : "#e6e9f0"} />
              <line x1={padLeft - 5} x2={padLeft} y1={y} y2={y} stroke="#98a2b3" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#667085" fontSize="12">
                {formatCompactEur(tick)}
              </text>
            </g>
          );
        })}
        {entries.map((entry, index) => {
          const center = padLeft + (plotWidth * (index + 0.5)) / entries.length;
          const barHeight = entry.cents <= 0 || scaleMax <= 0 ? 2 : Math.max((entry.cents / scaleMax) * plotHeight, 2);
          const barWidth = Math.min(22, (plotWidth / entries.length) * 0.62);
          const caption = shortAxisLabel(entry.title, vertical ? 16 : 28);
          return (
            <g key={entry.id}>
              {barHeight > 0 ? (
                <rect x={center - barWidth / 2} y={axisY - barHeight} width={barWidth} height={barHeight} rx={2} fill={color} />
              ) : null}
              <line x1={center} x2={center} y1={axisY} y2={axisY + 5} stroke="#98a2b3" />
              {vertical ? (
                <text
                  x={center}
                  y={axisY + 8}
                  textAnchor="end"
                  fill="#3d4a63"
                  fontSize="11"
                  transform={`rotate(-90 ${center} ${axisY + 8})`}
                >
                  {caption}
                </text>
              ) : (
                <text x={center} y={axisY + 18} textAnchor="middle" fill="#3d4a63" fontSize="12">
                  {caption}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function shortAxisLabel(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1)}…`;
}

function euroTicks(maxCents: number): number[] {
  if (maxCents <= 0) {
    return [0];
  }

  const rough = maxCents / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const end = Math.ceil(maxCents / step) * step;
  const ticks: number[] = [];

  for (let value = 0; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value));
    if (ticks.length > 5) {
      break;
    }
  }

  return ticks;
}
