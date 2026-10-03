"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#e1e6ee] bg-white px-3 text-left text-sm text-[#1c2740] outline-none focus-visible:border-[#5c4de0] focus-visible:ring-3 focus-visible:ring-[#5c4de0]/25"
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown className="size-4 shrink-0 text-[#5c6b78]" aria-hidden />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#e6e9f0] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
        >
          {options.map((option) => {
            const current = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={current}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={
                    current
                      ? "flex w-full px-3 py-2 text-left text-sm font-medium text-[#3d34b8]"
                      : "flex w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f5f6fa]"
                  }
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
