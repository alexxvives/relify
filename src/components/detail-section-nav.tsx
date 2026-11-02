"use client";

import { ArrowRight, CircleCheck, Clock, Info, Pencil } from "lucide-react";
import { useScrollSpy } from "@/components/use-scroll-spy";

export type DetailSectionStatus = "done" | "pending" | "dirty" | "info";

export type DetailSectionItem = { id: string; label: string; status: DetailSectionStatus; note?: string };

const statusText: Record<DetailSectionStatus, string> = {
  done: "Completo",
  pending: "Pendiente",
  dirty: "Sin guardar",
  info: "Informativo",
};

function StatusIcon({ status, className = "size-4" }: { status: DetailSectionStatus; className?: string }) {
  if (status === "done") {
    return <CircleCheck className={`${className} text-[#0f766e]`} aria-hidden />;
  }
  if (status === "dirty") {
    return <Pencil className={`${className} text-[#8a6112]`} aria-hidden />;
  }
  if (status === "pending") {
    return <Clock className={`${className} text-[#b7791f]`} aria-hidden />;
  }
  return <Info className={`${className} text-[#8b95a7]`} aria-hidden />;
}

/** t77: completion ring for the seller's required sections. */
export function CompletionRing({ done, total, size = 56 }: { done: number; total: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} de ${total} secciones completas`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e6f4f2" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ratio >= 1 ? "#0f766e" : "#2fc4b2"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-[#1c2740] text-[13px] font-semibold">
        {done}/{total}
      </text>
    </svg>
  );
}

/**
 * t77: section navigation for /mi-empresa/detalles. Desktop: sticky vertical rail with scroll-spy, per-section status
 * and a completion ring. Mobile: sticky horizontal pills. `next` links to the other tab.
 */
export function DetailSectionNav({
  items,
  progress,
  next,
}: {
  items: DetailSectionItem[];
  progress: { done: number; total: number; missing: string[] };
  next?: { label: string; onClick: () => void } | null;
}) {
  const { active, go } = useScrollSpy(
    items.map((item) => item.id),
    120,
  );
  const complete = progress.done >= progress.total;

  return (
    <>
      <nav aria-label="Secciones" className="sticky top-0 z-20 -mx-1 bg-[#e5eef0]/90 px-1 py-2 backdrop-blur lg:hidden">
        <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const current = item.id === active;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={current ? "location" : undefined}
                  onClick={(event) => {
                    if (go(item.id)) event.preventDefault();
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                    current ? "border-[#1c2740] bg-[#1c2740] text-white" : "border-[#e6e9f0] bg-white text-[#3d4a63]"
                  }`}
                >
                  <StatusIcon status={item.status} className="size-3.5" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <aside className="hidden lg:block">
        <nav aria-label="Secciones" className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-[#e6e9f0] bg-white p-4 shadow-[0_1px_2px_rgba(28,39,64,0.04)]">
          <div className="flex items-center gap-3">
            <CompletionRing done={progress.done} total={progress.total} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1c2740]">{complete ? "Todo listo" : "Tu progreso"}</p>
              <p className="text-xs text-[#64748b]">
                {complete ? "Has completado lo imprescindible." : `Falta: ${progress.missing.join(", ")}.`}
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-0.5 border-t border-[#eef0f4] pt-3">
            {items.map((item) => {
              const current = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={current ? "location" : undefined}
                    onClick={(event) => {
                      if (go(item.id)) event.preventDefault();
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                      current ? "border-[#0f766e] bg-[#e6f4f2] font-semibold text-[#1c2740]" : "border-transparent text-[#3d4a63] hover:bg-[#f5f6f8]"
                    }`}
                  >
                    <StatusIcon status={item.status} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="sr-only">{statusText[item.status]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          {next ? (
            <button
              type="button"
              onClick={next.onClick}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1c2740] px-3 text-sm font-semibold text-white hover:bg-[#2a3756] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              {next.label}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : null}
        </nav>
      </aside>
    </>
  );
}

/** t77: sticky bar shown while the form has unsaved changes. */
export function UnsavedBar({
  sections,
  saving,
  rejected,
  shake,
  value,
  onChoose,
}: {
  sections: string[];
  saving: boolean;
  rejected: boolean;
  shake: number;
  value: string;
  onChoose: (id: string) => void;
}) {
  if (sections.length === 0) {
    return null;
  }
  return (
    <div role="region" aria-label="Cambios sin guardar" className="sticky bottom-3 z-30 mt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6e9f0] bg-white/95 px-4 py-3 shadow-[0_8px_30px_-10px_rgba(28,39,64,0.35)] backdrop-blur">
        <p className="flex min-w-0 items-center gap-2 text-sm text-[#3d4a63]">
          <span className="size-2 shrink-0 rounded-full bg-[#e0a526]" aria-hidden />
          <span className="min-w-0">
            <span className="font-semibold text-[#1c2740]">Cambios sin guardar</span>
            <span className="hidden sm:inline"> en {sections.join(", ")}</span>
          </span>
        </p>
        <button
          key={rejected ? `${value}-${shake}` : value}
          type="submit"
          name="savePanel"
          value={value}
          disabled={saving}
          onClick={() => onChoose(value)}
          className={`inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white disabled:opacity-60 ${
            rejected ? "releva-shake bg-[#c0362c]" : "bg-[#0f766e] hover:bg-[#0c5f59]"
          }`}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
