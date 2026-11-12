"use client";

import { ViewportPortal } from "@/components/viewport-portal";
import { useCompactViewport } from "@/components/ui/use-compact";

export function SellerTabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: readonly T[];
}) {
  return (
    <div className="flex gap-1 border-b border-[#e7eaee]" role="tablist" aria-label={label}>
      {tabs.map((item) => {
        const selected = item.id === value;
        const off = disabled.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={off}
            disabled={off}
            onClick={() => {
              if (!off) {
                onChange(item.id);
              }
            }}
            className={
              off
                ? "-mb-px min-h-11 cursor-not-allowed border-b-2 border-transparent px-3 py-2 text-base text-[#98a2b3]"
                : selected
                  ? "-mb-px min-h-11 border-b-2 border-[#465ab4] px-3 py-2 text-base text-[#465ab4]"
                  : "-mb-px min-h-11 border-b-2 border-transparent px-3 py-2 text-base text-[#64748b]"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SegmentedTablist<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const index = tabs.findIndex((item) => item.id === value);
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.id);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="pointer-events-auto inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-[#e6e9f0] bg-white/90 p-1 shadow-[0_8px_24px_-12px_rgba(28,39,64,0.35)] backdrop-blur"
    >
      {tabs.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            data-tab={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none sm:px-5 ${
              selected ? "bg-[#1c2740] text-white" : "text-[#3d4a63] hover:bg-[#f1f4f8]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * t78/t96: Información empresa / Ficha pública.
 * Compact: in-flow under the page title, sticky below the app bar so it cannot cover the h1.
 * Desktop: viewport-portaled overlay, centred in the content column.
 */
export function FloatingSegmentedTabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  offsetClass = "",
  stuckBelowProgress = false,
}: {
  label: string;
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Leave room for the Tu progreso card so the toggle stays centred in the remaining column. */
  offsetClass?: string;
  /** Compact: sit under CompactProgressBar (header + slim bar). */
  stuckBelowProgress?: boolean;
}) {
  const compact = useCompactViewport();
  const tablist = <SegmentedTablist label={label} tabs={tabs} value={value} onChange={onChange} />;

  if (compact) {
    const stuck = stuckBelowProgress ? "top-[5.75rem] sm:top-[6.25rem]" : "top-14 sm:top-16";
    return (
      <div className={`sticky z-30 -mx-[var(--layout-pad)] border-b border-[#eef0f4] bg-white/95 px-[var(--layout-pad)] py-1.5 backdrop-blur ${stuck}`}>
        <div className="flex justify-center">{tablist}</div>
      </div>
    );
  }

  return (
    <ViewportPortal>
      <div className={`pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center px-3 sm:top-16 lg:top-3 lg:left-[var(--layout-sidebar)] ${offsetClass}`}>
        {tablist}
      </div>
    </ViewportPortal>
  );
}
