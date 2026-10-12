"use client";

import { useState } from "react";
import { donutPalettes, type DonutPalette } from "@/components/admin-charts";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminBilling, BillingBook, BillingEntry } from "@/server/getAdminBilling";

const bookPalette: Record<string, DonutPalette> = {
  subscriptions: "blue",
  listings: "orange",
  deposits: "green",
  closes: "red",
  "advisor-fees": "blue",
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
        <h2 className="text-xl font-semibold text-[#1c2740]">{book.title}</h2>
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
            <ul className="mt-3 flex flex-col gap-2">
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

const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric", timeZone: "Europe/Madrid" });

function SourceChart({ entries, color, label }: { entries: BillingEntry[]; color: string; label: string }) {
  const buckets = chartBuckets(entries);
  const [active, setActive] = useState<string | null>(null);
  const peak = Math.max(...buckets.map((bucket) => bucket.count), 0);
  const ticks = [...countTicks(peak)].reverse();
  const scaleMax = Math.max(...ticks, 1);
  const summary = buckets.map((bucket) => `${bucket.label}: ${bucket.count}`).join(", ");

  return (
    <figure className="mt-5" aria-label={label}>
      <div className="flex h-36 gap-2">
        <div className="flex w-7 shrink-0 flex-col justify-between pt-4 text-right text-[11px] tabular-nums text-[#98a2b3]">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 border-b border-[#e6e9f0]">
          {buckets.map((bucket) => {
            const ratio = bucket.count <= 0 ? 0 : bucket.count / scaleMax;
            const on = active === bucket.key;

            return (
              <div
                key={bucket.key}
                className="flex min-w-0 flex-1 flex-col"
                onMouseEnter={() => {
                  setActive(bucket.key);
                }}
                onMouseLeave={() => {
                  setActive(null);
                }}
              >
                <span
                  className={`h-4 text-center text-[11px] font-semibold tabular-nums ${on ? "text-[#1c2740]" : "text-transparent"}`}
                >
                  {bucket.count}
                </span>
                <div className="flex flex-1 items-end justify-center">
                  <span
                    className={`releva-bar rounded-t-full transition-all duration-300 ${on ? "w-3.5" : "w-2"}`}
                    style={{
                      height: `${Math.max(ratio * 100, bucket.count > 0 ? 10 : 0)}%`,
                      backgroundImage: `linear-gradient(180deg, ${color} 0%, ${color}b3 100%)`,
                      opacity: active === null || on ? 1 : 0.35,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex pl-9">
        {buckets.map((bucket, index) => (
          <span
            key={`${bucket.key}-label`}
            className={`min-w-0 flex-1 text-center text-[10px] leading-tight ${active === bucket.key ? "font-semibold text-[#1c2740]" : "text-[#667085]"}`}
          >
            {axisLabel(bucket, index, buckets)}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

function chartBuckets(entries: BillingEntry[]): { key: string; label: string; count: number }[] {
  const counted = countByMonth(entries);
  const byKey = new Map(counted.map((bucket) => [bucket.key, bucket]));
  const anchor = monthBucket(new Date().toISOString());
  const [yearText, monthText] = anchor.key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const keys = new Set<string>();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 15, 12));
    keys.add(monthBucket(date.toISOString()).key);
  }

  for (const bucket of counted) {
    if (bucket.key !== "none") {
      keys.add(bucket.key);
    }
  }

  const rows = [...keys]
    .filter((key) => key !== "none")
    .sort()
    .map((key) => byKey.get(key) ?? emptyMonth(key));
  const undated = byKey.get("none");

  if (undated && undated.count > 0) {
    rows.push(undated);
  }

  return rows;
}

const shortMonth = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "Europe/Madrid" });

function axisLabel(
  bucket: { key: string; label: string },
  index: number,
  buckets: { key: string }[],
): string {
  if (bucket.key === "none") {
    return "Sin fecha";
  }

  const [year, month] = bucket.key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15, 12));
  const name = shortMonth.format(date).replace(".", "");
  const previous = index > 0 ? buckets[index - 1]?.key.split("-")[0] : null;

  if (index === 0 || previous !== year) {
    return `${name} ${year.slice(2)}`;
  }

  return name;
}

function emptyMonth(key: string): { key: string; label: string; count: number } {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 15, 12));
  return { key, label: monthLabel.format(date), count: 0 };
}

function countByMonth(entries: BillingEntry[]): { key: string; label: string; count: number }[] {
  const buckets = new Map<string, { key: string; label: string; count: number }>();

  for (const entry of entries) {
    const bucket = monthBucket(entry.at);
    const current = buckets.get(bucket.key) ?? { ...bucket, count: 0 };
    current.count += 1;
    buckets.set(bucket.key, current);
  }

  return [...buckets.values()].sort((left, right) => {
    if (left.key === "none") {
      return 1;
    }

    if (right.key === "none") {
      return -1;
    }

    return left.key.localeCompare(right.key);
  });
}

function monthBucket(at: string | null): { key: string; label: string } {
  if (!at) {
    return { key: "none", label: "Sin fecha" };
  }

  const date = new Date(at);

  if (Number.isNaN(date.getTime())) {
    return { key: "none", label: "Sin fecha" };
  }

  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";

  return { key: `${year}-${month}`, label: monthLabel.format(date) };
}

function countTicks(max: number): number[] {
  if (max <= 0) {
    return [0];
  }

  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4);
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];

  for (let value = 0; value <= end; value += step) {
    ticks.push(value);
  }

  return ticks;
}
