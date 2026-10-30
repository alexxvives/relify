"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/form";

export function OptionSelect({
  name,
  label,
  value,
  options,
  onValueChange,
  searchable = false,
  searchPlaceholder = "",
  emptyLabel = "",
  menuClassName = "w-full",
  invalid = false,
}: {
  name?: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  menuClassName?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLocaleLowerCase("es-ES");
  const visible =
    searchable && needle.length > 0
      ? options.filter((option) => option.label.toLocaleLowerCase("es-ES").includes(needle))
      : options;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus();
    }
  }, [open, searchable]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        style={invalid ? { boxShadow: "0 0 0 2px #c0362c" } : undefined}
        className={
          invalid
            ? "releva-shake flex h-11 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#c0362c] bg-white px-3 text-left text-base text-[#2b3b4a] outline-none"
            : "flex h-11 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#e7eaee] bg-white px-3 text-left text-base text-[#2b3b4a] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20"
        }
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <ChevronDown className="size-4 shrink-0 text-[#5c6b78]" aria-hidden />
      </button>
      {open ? (
        <div className={`absolute z-30 mt-1 overflow-hidden rounded-xl border border-[#e6e9f0] bg-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)] ${menuClassName}`}>
          {searchable ? (
            <div className="border-b border-[#eef0f3] p-2">
              <Input
                ref={searchRef}
                value={query}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
                size="sm"
              />
            </div>
          ) : null}
          <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-auto py-1">
            {visible.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#64748b]">{emptyLabel}</li>
            ) : (
              visible.map((option) => {
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
                        setQuery("");
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
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
