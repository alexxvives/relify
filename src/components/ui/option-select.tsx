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
  id,
  describedBy,
  placeholder,
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
  /** t91: lets a visible <label htmlFor> name the trigger. */
  id?: string;
  describedBy?: string;
  /** t92: muted prompt for an empty value, so the trigger never repeats the field label in larger type. */
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
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
        // t91: inside a dialog, Escape closes only the menu, not the dialog behind it.
        event.stopPropagation();
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
        if (items.length === 0) return;
        event.preventDefault();
        const at = items.findIndex((item) => item === document.activeElement);
        const next =
          event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1;
        items[next]?.focus();
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
    } else if (open) {
      // t91: keyboard users land on the selected option and move with the arrows.
      const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
      const current = listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      (current ?? items?.[0])?.focus();
    }
  }, [open, searchable]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-describedby={describedBy}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={id ? undefined : label}
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
        <span className={selected || !placeholder ? "truncate" : "truncate text-[#98a2b3]"}>{selected?.label ?? placeholder ?? label}</span>
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
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-auto py-1">
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
                        triggerRef.current?.focus();
                      }}
                      className={
                        current
                          ? "flex w-full px-3 py-2 text-left text-sm font-medium text-[#3d34b8] focus-visible:bg-[#f5f6fa] focus-visible:outline-none"
                          : "flex w-full px-3 py-2 text-left text-sm text-[#1c2740] hover:bg-[#f5f6fa] focus-visible:bg-[#f5f6fa] focus-visible:outline-none"
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
