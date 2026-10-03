"use client";

export function SellerTabs<T extends string>({
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
  return (
    <div className="flex gap-1 border-b border-[#e7eaee]" role="tablist" aria-label={label}>
      {tabs.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              onChange(item.id);
            }}
            className={
              selected
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
