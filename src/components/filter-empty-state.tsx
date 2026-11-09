"use client";

import type { ReactNode } from "react";

export function FilterEmptyState({
  message,
  actionLabel,
  onClear,
  children,
}: {
  message: string;
  actionLabel: string;
  onClear?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[22rem]">
      <div aria-hidden className="pointer-events-none select-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-[#e3e7ee] bg-white/95 p-5 text-center shadow-[0_8px_24px_rgba(28,39,64,0.10)]">
          <p className="text-sm text-[#5c6b78]">{message}</p>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1c2740] px-5 text-sm font-semibold text-white hover:bg-[#141c30] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MutedAdvisorCards({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,26rem),1fr))]">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
          <div className="bg-[#eef1f5] p-4">
            <div className="flex justify-between">
              <span className="h-4 w-40 rounded-lg bg-[#dfe4ec]" />
              <span className="h-8 w-16 rounded-lg bg-[#dfe4ec]" />
            </div>
            <div className="mt-3 flex gap-1.5">
              <span className="h-6 w-24 rounded-full bg-[#dfe4ec]" />
              <span className="h-6 w-20 rounded-full bg-[#dfe4ec]" />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <span className="h-3.5 w-40 rounded bg-[#e9edf2]" />
            <span className="h-3.5 w-32 rounded bg-[#e9edf2]" />
            <span className="mx-auto mt-1 h-8 w-28 rounded-full bg-[#e9edf2]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MutedMarketCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(21rem,100%),1fr))] gap-5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white">
          <div className="aspect-[16/7] max-h-52 bg-[#eef1f5]" />
          <div className="flex flex-col gap-2 px-5 pt-6 pb-5">
            <span className="h-4 w-24 rounded bg-[#e9edf2]" />
            <span className="h-4 w-full rounded bg-[#e9edf2]" />
            <span className="h-4 w-3/4 rounded bg-[#e9edf2]" />
            <span className="mt-2 h-16 w-full rounded-2xl bg-[#eef1f5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
