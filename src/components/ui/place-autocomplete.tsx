"use client";

import { MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/form";
import { minPlaceQuery, searchPlaces } from "@/lib/client/place-search";
import type { PlaceSuggestion } from "@/lib/spain-places";

const debounceMs = 300;

/**
 * S25: one "Ubicación" input that suggests "Ciudad, Provincia" from OpenStreetMap while typing.
 * Free text always stays valid: the parent splits it on the last comma.
 */
export function PlaceAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
  label,
  id,
  query = value,
  icon = true,
  inputProps = {},
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (place: PlaceSuggestion) => void;
  placeholder?: string;
  label: string;
  id?: string;
  /** S32: text to look up when it differs from the field (Tu empresa drops the leading postal code). */
  query?: string;
  /** S32: off where the row already shows a location icon. */
  icon?: boolean;
  inputProps?: { name?: string; "data-flash"?: boolean };
}) {
  const listId = useId();
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const typed = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typed.current || query.trim().length < minPlaceQuery) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchPlaces(query.trim(), controller.signal)
        .then((next) => {
          setItems(next);
          setActive(-1);
          setLoading(false);
        })
        .catch(() => {
          // Aborted by the next keystroke; the newer lookup owns the state.
        });
    }, debounceMs);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

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

  function pick(place: PlaceSuggestion) {
    typed.current = false;
    onPick(place);
    setItems([]);
    setOpen(false);
    setActive(-1);
  }

  const showList = open && items.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <Input
        {...inputProps}
        id={id}
        icon={icon ? MapPin : undefined}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-busy={loading || undefined}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          typed.current = true;
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && items.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActive((current) => (current + 1) % items.length);
          } else if (event.key === "ArrowUp" && items.length > 0) {
            event.preventDefault();
            setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
          } else if (event.key === "Enter" && showList && active >= 0) {
            event.preventDefault();
            const place = items[active];
            if (place) {
              pick(place);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showList ? (
        <div className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#e7eaee] bg-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]">
          <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-auto py-1">
            {items.map((place, index) => (
              <li
                key={place.label}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(place)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm text-[#1c2740] ${index === active ? "bg-[#f4f7ff]" : ""}`}
              >
                <MapPin className="size-4 shrink-0 text-[#8b95a7]" aria-hidden />
                <span className="truncate">{place.label}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-[#eef0f4] px-3 py-1.5 text-right text-[11px] text-[#8b95a7]">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">
              © OpenStreetMap
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
