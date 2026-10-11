"use client";

import { useState } from "react";
import { donutPalettes, type DonutPalette } from "@/components/admin-charts";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminBilling, BillingBook } from "@/server/getAdminBilling";

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
          <SourceChart values={book.entries.map((entry) => entry.cents)} color={color} label={book.title} />
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

function SourceChart({ values, color, label }: { values: number[]; color: string; label: string }) {
  const flat = values.every((value) => value <= 0);
  const bars = flat ? values.map(() => 1) : values;
  const peak = Math.max(...bars, 1);
  const width = Math.max(bars.length * 14, 14);

  return (
    <svg viewBox={`0 0 ${width} 48`} className="mt-4 h-16 w-full" role="img" aria-label={label}>
      {bars.map((value, index) => {
        const height = Math.max((value / peak) * 40, 3);
        return <rect key={index} x={index * 14 + 2} y={46 - height} width={10} height={height} rx={2} fill={color} />;
      })}
    </svg>
  );
}
