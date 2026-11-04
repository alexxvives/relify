"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/form";

// t95: only one menu is open at a time across the page; opening another closes the previous one.
let closeOpenMenu: (() => void) | null = null;

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
  textSize = "base",
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
  /** t94: "sm" matches the 14px text inputs (fieldInputClass); default keeps the 16px form inputs. */
  textSize?: "base" | "sm"; // sm also uses h-10, like fieldInputClass
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // t94: the menu renders in a body portal with fixed coordinates, so no card or dialog can clip it; it opens upward
  // when there is not enough room below the trigger.
  const [place, setPlace] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
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
      if (!(event.target instanceof Node) || (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target))) {
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
    if (!open) return;
    const close = () => {
      setOpen(false);
      setQuery("");
    };
    if (closeOpenMenu && closeOpenMenu !== close) closeOpenMenu();
    closeOpenMenu = close;
    return () => {
      if (closeOpenMenu === close) closeOpenMenu = null;
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // t95: close once the trigger scrolls out of view (window or any scrolling parent), so the menu never floats
      // over unrelated parts of the page.
      let clip = { top: 0, bottom: window.innerHeight };
      for (let node = triggerRef.current?.parentElement; node && node !== document.body; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowY;
        if (overflow === "auto" || overflow === "scroll") {
          const box = node.getBoundingClientRect();
          clip = { top: Math.max(clip.top, box.top), bottom: Math.min(clip.bottom, box.bottom) };
        }
      }
      if (rect.bottom < clip.top || rect.top > clip.bottom) {
        setOpen(false);
        setQuery("");
        return;
      }
      const gap = 4;
      const margin = 8;
      const wanted = Math.min(menuRef.current?.scrollHeight ?? 280, 320);
      // t95b: a "w-full" menu is measured before it gets its width (100 % of the viewport while hidden), which clamped
      // it to the left edge; it always ends up as wide as the trigger, so use that.
      const menuWidth = menuClassName === "w-full" ? rect.width : Math.max(rect.width, menuRef.current?.offsetWidth ?? 0);
      const left = Math.min(rect.left, window.innerWidth - margin - menuWidth);
      const below = window.innerHeight - rect.bottom - gap - margin;
      const above = rect.top - gap - margin;
      const up = below < wanted && above > below;
      setPlace({
        left: Math.max(margin, left),
        width: rect.width,
        ...(up ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
        maxHeight: Math.max(120, up ? above : below),
      });
    };
    measure();
    const schedule = (event?: Event) => {
      // Scrolling inside the menu's own list must not move or close it.
      if (event && event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      // t95: never reuse the last position on the next open (the menu used to flash where it was before).
      setPlace(null);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, menuClassName]);

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
            ? `releva-shake flex ${textSize === "sm" ? "h-10" : "h-11"} w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#c0362c] bg-white px-3 text-left ${textSize === "sm" ? "text-sm" : "text-base"} text-[#2b3b4a] outline-none`
            : `flex ${textSize === "sm" ? "h-10" : "h-11"} w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#e7eaee] bg-white px-3 text-left ${textSize === "sm" ? "text-sm" : "text-base"} text-[#2b3b4a] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20`
        }
      >
        <span className={selected || !placeholder ? "truncate" : "truncate text-[#98a2b3]"}>{selected?.label ?? placeholder ?? label}</span>
        <ChevronDown className="size-4 shrink-0 text-[#5c6b78]" aria-hidden />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={menuRef}
          style={
            place
              ? { position: "fixed", left: place.left, ...(menuClassName === "w-full" ? { width: place.width } : { minWidth: place.width }), top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }
              : { position: "fixed", visibility: "hidden" }
          }
          className={`z-[70] flex flex-col overflow-hidden rounded-xl border border-[#e6e9f0] bg-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)] ${menuClassName}`}
        >
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
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-64 min-h-0 overflow-auto py-1">
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
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
