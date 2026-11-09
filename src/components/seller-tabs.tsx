"use client";

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

/**
 * Segmented pill tablist (Información empresa / Ficha pública). The parent
 * centers it in the header row from lg up (title stays left); below lg it sits
 * centered under the heading. Same tablist semantics as SellerTabs, with arrow-key navigation.
 */
export function FloatingSegmentedTabs<T extends string>({
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
      className="inline-flex shrink-0 gap-1 self-start rounded-full border border-[#e6e9f0] bg-white p-1 shadow-[0_8px_24px_-12px_rgba(28,39,64,0.35)] lg:self-auto"
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
            className={`min-h-11 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none sm:px-5 ${
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
