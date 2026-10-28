"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const subscribeNever = () => () => {};
function readUrlPage() {
  const fromUrl = Number(new URLSearchParams(window.location.search).get("page"));
  return Number.isInteger(fromUrl) && fromUrl > 1 ? fromUrl : 1;
}

/** Reads ?page= on mount and writes it back without a navigation, so a reload or shared link keeps the page. */
export function usePageParam(total: number, pageSize: number, resetKey: string) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // The URL page is read after hydration (the server renders page 1), without a setState inside an effect.
  const urlPage = useSyncExternalStore(subscribeNever, readUrlPage, () => null);
  const ready = urlPage !== null;
  const [picked, setPicked] = useState<number | null>(null);
  const page = picked ?? urlPage ?? 1;

  // A new filter starts again at page 1.
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPicked(1);
  }

  const current = Math.min(page, pages);

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    if (current > 1) url.searchParams.set("page", String(current));
    else url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }, [current, ready]);

  function setPage(next: number) {
    setPicked(Math.min(Math.max(1, next), pages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return { page: current, pages, setPage, start: (current - 1) * pageSize, end: current * pageSize };
}

function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const base =
  "inline-flex size-10 items-center justify-center rounded-xl text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[#465ab4]/30";

export function Pagination({ page, pages, onChange, label = "Paginación" }: { page: number; pages: number; onChange: (page: number) => void; label?: string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className="mt-8 flex items-center justify-center gap-1">
      <button type="button" className={`${base} text-[#1c2740] hover:bg-[#eef1f6] disabled:opacity-40`} onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Página anterior">
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      {pageList(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="w-6 text-center text-sm text-[#8a94a6]" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Página ${item}`}
            className={`${base} tabular-nums ${item === page ? "bg-[#1c2740] text-white" : "text-[#1c2740] hover:bg-[#eef1f6]"}`}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" className={`${base} text-[#1c2740] hover:bg-[#eef1f6] disabled:opacity-40`} onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Página siguiente">
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
