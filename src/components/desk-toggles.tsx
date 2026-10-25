"use client";

import { ChevronDown } from "lucide-react";

/**
 * A row of disclosure buttons for a process's Chat, Reuniones and Asesor panels.
 * Everything starts collapsed; pressing the open one again closes it.
 */
export function DeskToggles<T extends string>({
  label,
  tabs,
  value,
  onChange,
  controls,
  disabled = [],
}: {
  label: string;
  tabs: readonly { id: T; label: string; count?: number }[];
  value: T | null;
  onChange: (id: T | null) => void;
  /** id of the panel element the buttons reveal */
  controls: string;
  disabled?: readonly T[];
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {tabs.map((item) => {
        const open = item.id === value;
        const off = disabled.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-expanded={open}
            aria-controls={open ? controls : undefined}
            disabled={off}
            onClick={() => onChange(open ? null : item.id)}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4] ${
              off
                ? "cursor-not-allowed border-[#eef0f3] text-[#98a2b3]"
                : open
                  ? "border-[#465ab4] bg-[#eef1fb] text-[#33429a]"
                  : "border-[#e1e5ee] bg-white text-[#3d4a63] hover:border-[#c9d2f5] hover:bg-[#f7f8fc]"
            }`}
          >
            {item.label}
            {item.count && item.count > 0 && !open ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#465ab4] px-1.5 text-xs font-semibold text-white tabular-nums">
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : null}
            <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
          </button>
        );
      })}
    </div>
  );
}
