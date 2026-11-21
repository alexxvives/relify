"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ArrowRight, ChevronDown, Circle, CircleCheck, Clock, Info, Minimize2, Pencil } from "lucide-react";
import { useScrollSpy } from "@/components/shell/use-scroll-spy";
import { ViewportPortal } from "@/components/shell/viewport-portal";

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

/**
 * Compact sticky percent + bar under the app header (phones). Desktop keeps CompletionRing.
 * S30: it is also the phone button for Tu progreso; a tap opens the card as a popover over the page.
 */
export function CompactProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((Math.min(done, total) / total) * 100) : 0;
  return (
    <div className="sticky top-14 z-30 -mx-[var(--layout-pad)] border-b border-[#eef0f4] bg-white/95 px-[var(--layout-pad)] backdrop-blur sm:top-16 lg:hidden">
      <button
        type="button"
        data-progress-toggle="peek"
        aria-haspopup="true"
        aria-label={`Mostrar tu progreso: ${percent} por ciento completado`}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 py-1.5 focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
      >
        <span className="shrink-0 text-xs font-semibold tabular-nums text-[#1c2740]">{percent}%</span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e6e9f0]">
          <div className="h-full rounded-full bg-[#2fc4b2] transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-[#64748b]">
          {done}/{total}
        </span>
      </button>
    </div>
  );
}

/** t77: completion ring for the seller's required sections. */
export function CompletionRing({ done, total, size = 56 }: { done: number; total: number; size?: number }) {
  const stroke = size <= 40 ? 4 : 6;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  const labelSize = size <= 40 ? 9 : 13;
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
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="#1c2740"
        fontSize={labelSize}
        fontWeight="600"
      >
        {done}/{total}
      </text>
    </svg>
  );
}

/**
 * S31 (Alex): the Información empresa column uses the full page width (like /procesos), so there is no free margin for a
 * pinned card. Tu progreso is always a popover over the page: the round pill at the top-right from 1024 px, the slim
 * progress bar on phones. It never reserves a gutter and never moves the content.
 */
const progressPeekEvent = "releva:progress-peek";

/**
 * Floating progress tracker for Información empresa: a pill that opens the card as a popover at the viewport top-right.
 */
function ProgressTrackerOverlay({
  label,
  trigger,
  children,
  openOnEntry = false,
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  /** S40 (Alex): a deep link (?seccion=… or ?ancla=…) opens the card expanded unless the profile is complete. */
  openOnEntry?: boolean;
}) {
  // The card is a popover the seller opened; it closes on Minimizar, Escape, a jump or a click outside it.
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (!openOnEntry || !(query.has("seccion") || query.has("ancla"))) return;
    const frame = window.requestAnimationFrame(() => setPeek(true));
    return () => window.cancelAnimationFrame(frame);
    // Only on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    function onPeek(event: Event) {
      setPeek(event instanceof CustomEvent && event.detail === true);
    }
    function onDocClick(event: MouseEvent) {
      const node = event.target;
      if (!(node instanceof Element)) {
        return;
      }
      if (node.closest('[data-progress-toggle="peek"]')) {
        setPeek((open) => !open);
      } else if (node.closest('[data-progress-toggle="collapse"]')) {
        setPeek(false);
      } else if (node.closest('[data-progress-toggle="expand"]')) {
        setPeek(true);
      } else if (!node.closest("[data-section-tracker]")) {
        setPeek(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPeek(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener(progressPeekEvent, onPeek);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(progressPeekEvent, onPeek);
    };
  }, []);
  const cardClass = peek ? "flex" : "hidden";
  const pillClass = peek ? "hidden" : "flex";

  return (
    <ViewportPortal>
    <div
      className={`pointer-events-none fixed top-[6.25rem] right-3 z-40 sm:top-[6.75rem] lg:top-3 lg:right-4 lg:block ${peek ? "block" : "hidden"}`}
      data-section-tracker="true"
    >
      <div className="pointer-events-auto flex flex-col items-end">
        <div
          role="navigation"
          aria-label={label}
          className={`${cardClass} max-h-[min(32rem,calc(100dvh-var(--shell-tabbar,3.5rem)-8rem))] flex-col overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_12px_32px_-12px_rgba(28,39,64,0.28)]`}
          style={{ width: "min(17.25rem, calc(100vw - 1.5rem))" }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#eef0f4] px-3 py-2.5">
            <p className="text-xs font-semibold tracking-wide text-[#64748b] uppercase">{label}</p>
            <button
              type="button"
              data-progress-toggle="collapse"
              aria-expanded="true"
              aria-label="Minimizar tu progreso"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f5f6f8] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
            >
              <Minimize2 className="size-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
        </div>
        <button
          type="button"
          data-progress-toggle="expand"
          aria-expanded="false"
          aria-label="Mostrar tu progreso"
          className={`${pillClass} size-11 cursor-pointer items-center justify-center rounded-full border border-[#e6e9f0] bg-white/95 shadow-[0_8px_24px_-12px_rgba(28,39,64,0.4)] backdrop-blur focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none`}
        >
          {trigger}
        </button>
      </div>
    </div>
    </ViewportPortal>
  );
}

/**
 * Section navigation + progress for /mi-empresa/detalles (Información empresa only).
 * Compact: slim percent bar under the header (CompactProgressBar), which opens the card as a popover.
 * From lg: round pill at the top-right that opens the card as a popover. It always floats over the page.
 */
export function DetailSectionNav({
  items,
  progress,
  onMissing,
}: {
  items: DetailSectionItem[];
  progress: {
    done: number;
    total: number;
    missing: Array<{ id: string; label: string }>;
    missingRequired?: number;
    missingRecommended?: number;
    fields?: DetailField[];
  };
  /** Required fields that live outside the visible sections (e.g. on the other tab) open their tab first. */
  onMissing?: (id: string) => boolean;
}) {
  const { active, go } = useScrollSpy(
    items.map((item) => item.id),
    120,
  );
  const fields = progress.fields ?? [];
  const groups = items.map((item) => ({
    item,
    pending: fields.filter((field) => field.group === item.id && !field.done),
  }));

  function collapseTrackerIfCompact() {
    // Close the popover after a jump so the field it points at is visible.
    window.dispatchEvent(new CustomEvent(progressPeekEvent, { detail: false }));
  }

  function jump(id: string) {
    return (event: React.MouseEvent) => {
      if (onMissing?.(id) || go(id)) {
        event.preventDefault();
        collapseTrackerIfCompact();
      }
    };
  }

  function jumpSection(itemId: string, pending: DetailField[]) {
    return (event: React.MouseEvent) => {
      const firstPending = pending[0]?.id;
      if (firstPending && onMissing?.(firstPending)) {
        event.preventDefault();
        collapseTrackerIfCompact();
        return;
      }
      if (onMissing?.(itemId) || go(itemId)) {
        event.preventDefault();
        collapseTrackerIfCompact();
      }
    };
  }

  function renderList() {
    return (
    <>
          <div className="mb-2 flex items-center gap-3 px-2 pt-1 pb-2">
            <CompletionRing done={progress.done} total={progress.total} size={48} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1c2740]">
                {progress.done} de {progress.total} secciones
              </p>
              <p className="truncate text-[13px] text-[#64748b]">
                {items.find((item) => item.id === active)?.label ?? items[0]?.label ?? "Secciones"}
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-0.5">
            {groups.map(({ item, pending }) => {
              const current = item.id === active;
              const expanded = current;
              return (
                <li key={item.id}>
                  <a
                    href={`#${pending[0]?.id ?? item.id}`}
                    aria-current={current ? "location" : undefined}
                    aria-expanded={pending.length > 0 ? expanded : undefined}
                    onClick={jumpSection(item.id, pending)}
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none ${
                      current ? "bg-[#e6f4f2] text-[#1c2740]" : "text-[#3d4a63] hover:bg-[#f5f6f8]"
                    }`}
                  >
                    <StatusIcon status={item.status} className="size-3.5" />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                    <span className="sr-only">{statusText[item.status]}</span>
                    {pending.length > 0 ? (
                      <ChevronDown
                        className={`size-3.5 shrink-0 text-[#8b95a7] transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    ) : null}
                  </a>
                  {expanded && pending.length > 0 ? (
                    <ul className="mt-0.5 ml-[1.0625rem] flex flex-col border-l border-[#eef0f4] pl-2">
                      {pending.map((field) => (
                        <li key={field.id}>
                          <a
                            href={`#${field.id}`}
                            onClick={jump(field.id)}
                            className="group flex items-start gap-2 rounded-md px-1.5 py-1.5 text-[13px] leading-snug focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none hover:bg-[#f5f6f8]"
                          >
                            <Circle className="mt-0.5 size-3.5 shrink-0 text-[#b6bfcc]" aria-hidden />
                            <span className="flex min-w-0 flex-1 flex-col text-[#1c2740]">
                              {field.label}
                              {field.required === undefined ? null : <RequirementTag required={field.required} />}
                            </span>
                            <span className="sr-only">Pendiente</span>
                            <span aria-hidden className="mt-px hidden items-center gap-0.5 text-[11px] font-semibold text-[#0f766e] group-hover:inline-flex group-focus-visible:inline-flex">
                              Ir
                              <ArrowRight className="size-3" />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
    </>
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <ProgressTrackerOverlay
          label="Tu progreso"
          trigger={<CompletionRing done={progress.done} total={progress.total} size={36} />}
          openOnEntry={progress.done < progress.total}
        >
          {renderList()}
        </ProgressTrackerOverlay>
      </div>
    </>
  );
}

export type DetailField = { id: string; label: string; done: boolean; group: string; required?: boolean };

/** t88: same Obligatorio / Recomendado tags as the Inicio checklist (seller-overview.tsx), compact for the side panel. */
function RequirementTag({ required }: { required: boolean }) {
  return (
    <span
      className={`mt-0.5 w-fit rounded-full px-1.5 py-px text-[10px] leading-4 font-semibold whitespace-nowrap ${
        required ? "bg-[#fdecea] text-[#a12f2f]" : "bg-[#fff4d6] text-[#8a6112]"
      }`}
    >
      {required ? "Obligatorio" : "Recomendado"}
    </span>
  );
}


/**
 * t77/t78/t92: sticky save bar. A slim bar pinned to the bottom of the content column while the form has unsaved
 * changes or the last save failed (with the reason), with Descartar / Guardar; briefly "Cambios guardados" after a save.
 * The one pattern for every unsaved-changes state on the page.
 */
export function UnsavedBar({
  sections,
  saving,
  rejected,
  shake,
  value,
  onChoose,
  onDiscard,
  error = null,
  savedStamp = null,
}: {
  sections: string[];
  saving: boolean;
  rejected: boolean;
  shake: number;
  value: string;
  onChoose: (id: string) => void;
  onDiscard?: () => void;
  error?: string | null;
  savedStamp?: number | null;
}) {
  const [shownStamp, setShownStamp] = useState<number | null>(null);
  const [hiddenStamp, setHiddenStamp] = useState<number | null>(null);
  if (savedStamp !== null && savedStamp !== shownStamp) {
    setShownStamp(savedStamp);
  }
  useEffect(() => {
    if (shownStamp === null) {
      return;
    }
    const timer = window.setTimeout(() => setHiddenStamp(shownStamp), 4000);
    return () => window.clearTimeout(timer);
  }, [shownStamp]);
  const justSaved = savedStamp !== null && savedStamp === shownStamp && hiddenStamp !== shownStamp && sections.length === 0;
  const shell = "sticky z-30 -mx-1 mt-3 px-1 pb-3 bottom-[var(--shell-tabbar)]";
  const bar = "flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-white/95 py-2 pr-2 pl-4 shadow-[0_4px_16px_-8px_rgba(28,39,64,0.3)] backdrop-blur";

  if (justSaved) {
    return (
      <div className={shell}>
        <p role="status" className={`${bar} border-[#bfe6df] text-sm font-medium text-[#0f766e]`}>
          <CircleCheck className="size-4" aria-hidden />
          Cambios guardados
        </p>
      </div>
    );
  }
  if (sections.length === 0 && !error) {
    return null;
  }
  return (
    <div role="region" aria-label="Guardar cambios" className={shell}>
      <div className={`${bar} ${error ? "border-[#f0c2c2]" : "border-[#e6e9f0]"}`}>
        <div className="min-w-0 flex-1 text-sm text-[#3d4a63]">
          {error ? (
            <p role="alert" className="flex items-start gap-2 font-medium text-[#b42318]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>No se ha guardado. {error}</span>
            </p>
          ) : (
            <p className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-[#e0a526]" aria-hidden />
              <span className="min-w-0 truncate">
                <span className="hidden text-[#64748b] sm:inline">{sections.join(", ")}</span>
              </span>
            </p>
          )}
        </div>
        {sections.length > 0 ? (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {onDiscard ? (
              <button
                type="button"
                disabled={saving}
                onClick={onDiscard}
                className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#475467] hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-60"
              >
                Descartar
              </button>
            ) : null}
            <button
              key={rejected ? `${value}-${shake}` : value}
              type="submit"
              name="savePanel"
              value={value}
              disabled={saving}
              onClick={() => onChoose(value)}
              className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-60 ${
                rejected ? "releva-shake bg-[#c0362c]" : "bg-[#0f766e] hover:bg-[#0c5f59]"
              }`}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
