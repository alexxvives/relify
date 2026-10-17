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
                ? "-mb-px cursor-not-allowed border-b-2 border-transparent px-3 py-2 text-base text-[#98a2b3]"
                : selected
                  ? "-mb-px border-b-2 border-[#465ab4] px-3 py-2 text-base text-[#465ab4]"
                  : "-mb-px border-b-2 border-transparent px-3 py-2 text-base text-[#64748b]"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
