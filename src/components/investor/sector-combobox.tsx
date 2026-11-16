"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/form";
import { investorCopy } from "@/lib/investor-copy";
import { addSector, filterSectors, sectorJoiner, splitSectors } from "@/lib/sector-picks";

type Option = { kind: "known"; label: string } | { kind: "custom"; label: string };

/**
 * Alex (S25): a single "Añadir sector" field. Typing filters the known sectors; click or Enter adds
 * one. Enter with no match adds the typed text as its own sector (shown as "Añadir “X”"), so
 * nothing typed is lost. Chosen sectors are chips with a remove button.
 */
export function SectorCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const chips = splitSectors(value);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [browsed, setBrowsed] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const typed = query.trim();
  const matches = filterSectors(options, chips, typed);
  const exact = matches.some((label) => label.localeCompare(typed, "es", { sensitivity: "base" }) === 0);
  const list: Option[] = [
    ...matches.map((label) => ({ kind: "known" as const, label })),
    ...(typed.length > 0 && !exact ? [{ kind: "custom" as const, label: typed }] : []),
  ];
  const showList = open && list.length > 0;
  const current = Math.min(active, Math.max(0, list.length - 1));

  useEffect(() => {
    if (!open) {
      return;
    }
    function close(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  function add(raw: string) {
    const result = addSector(chips, raw, options);
    if (!result.ok) {
      setNote(result.reason === "duplicate" ? investorCopy.sectorsDuplicate : result.reason === "too-long" ? investorCopy.sectorsTooLong : null);
      return;
    }
    onChange(result.next.join(sectorJoiner));
    setQuery("");
    setActive(0);
    setBrowsed(false);
    setNote(null);
  }

  function remove(chip: string) {
    onChange(chips.filter((item) => item !== chip).join(sectorJoiner));
    setNote(null);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <div className="relative">
        <Input
          icon={Plus}
          value={query}
          placeholder={investorCopy.sectorsPlaceholder}
          aria-label={investorCopy.sectorsAdd}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${current}` : undefined}
          autoComplete="off"
          enterKeyHint="enter"
          onFocus={() => setOpen(true)}
          onMouseDown={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setBrowsed(false);
            setOpen(true);
            setNote(null);
          }}
          onKeyDown={(event) => {
            // S26: an IME/dead-key composition (é, ñ on some keyboards) must finish before Enter adds.
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (event.key === "ArrowDown" && list.length > 0) {
              event.preventDefault();
              setOpen(true);
              setBrowsed(true);
              setActive((current + 1) % list.length);
            } else if (event.key === "ArrowUp" && list.length > 0) {
              event.preventDefault();
              setBrowsed(true);
              setActive(current <= 0 ? list.length - 1 : current - 1);
            } else if (event.key === "Enter") {
              // Never submit the form from here: Enter always adds (highlighted option or typed text).
              event.preventDefault();
              // An empty field adds only an option picked with the arrows, never the first one by accident.
              const option = showList && (typed.length > 0 || browsed) ? list[current] : undefined;
              if (option || typed.length > 0) {
                add(option ? option.label : typed);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Backspace" && query.length === 0 && chips.length > 0) {
              const last = chips[chips.length - 1];
              if (last) {
                remove(last);
              }
            }
          }}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={investorCopy.sectorsAdd}
            className="absolute top-full z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-[#e7eaee] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
          >
            {list.map((option, index) => (
              <li
                key={`${option.kind}-${option.label}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === current}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => add(option.label)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 text-left text-sm ${index === current ? "bg-[#f4f7ff]" : ""} ${option.kind === "custom" ? "border-t border-[#eef0f4] font-medium text-[#465ab4]" : "text-[#1c2740]"}`}
              >
                {option.kind === "custom" ? <Plus className="size-4 shrink-0" aria-hidden /> : null}
                <span className="min-w-0 truncate">{option.kind === "custom" ? investorCopy.sectorsAddCustom(option.label) : option.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {note ? (
        <p role="status" className="text-xs text-[#b54708]">
          {note}
        </p>
      ) : null}
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={investorCopy.sectorsLabel}>
          {chips.map((chip) => (
            <li key={chip} className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] py-1 pr-1 pl-3 text-sm text-[#1c2740]">
              {chip}
              <button
                type="button"
                aria-label={investorCopy.sectorsRemove(chip)}
                onClick={() => remove(chip)}
                className="inline-flex size-6 items-center justify-center rounded-full text-[#5c6b78] hover:bg-white hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#465ab4] focus-visible:outline-none"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
