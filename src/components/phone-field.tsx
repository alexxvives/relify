"use client";

import { useRef } from "react";
import { authCopy } from "@/lib/auth-copy";
import { formatNationalPhone, phoneCountries, phoneNationalLimit } from "@/lib/phone-countries";
import { OptionSelect } from "@/components/ui/option-select";

const phoneCountryOptions = [
  ...phoneCountries.filter((country) => country.iso === "ES"),
  ...phoneCountries
    .filter((country) => country.iso !== "ES")
    .sort((left, right) => left.name.localeCompare(right.name, "es")),
].map((country) => ({
  value: country.iso,
  label: `${country.name} +${country.dial}`,
}));

export function PhoneField({
  country,
  national,
  invalid = false,
  onCountryChange,
  onNationalChange,
}: {
  country: string;
  national: string;
  invalid?: boolean;
  onCountryChange: (value: string) => void;
  onNationalChange: (value: string) => void;
}) {
  const limit = phoneNationalLimit(country);
  const inputRef = useRef<HTMLInputElement>(null);
  const formatted = formatNationalPhone(country, national);

  return (
    <div className="grid grid-cols-[minmax(7.5rem,10.5rem)_minmax(0,1fr)] gap-2">
      <OptionSelect
        name="phoneCountry"
        label={authCopy.phoneCountryLabel}
        value={country}
        options={phoneCountryOptions}
        searchable
        searchPlaceholder={authCopy.phoneCountrySearch}
        emptyLabel={authCopy.phoneCountryEmpty}
        menuClassName="w-72"
        onValueChange={(value) => {
          onCountryChange(value);
          onNationalChange(national.replace(/\D/g, "").slice(0, phoneNationalLimit(value)));
        }}
      />
      <input type="hidden" name="phone" value={national} />
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required
        value={formatted}
        onChange={(event) => {
          const raw = event.target.value;
          const caret = event.target.selectionStart ?? raw.length;
          const digitsBefore = raw.slice(0, caret).replace(/\D/g, "").length;
          const next = raw.replace(/\D/g, "").slice(0, limit);
          onNationalChange(next);
          const nextFormatted = formatNationalPhone(country, next);
          const nextCaret = caretAfterDigits(nextFormatted, Math.min(digitsBefore, next.length));
          requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(nextCaret, nextCaret);
          });
        }}
        aria-invalid={invalid || undefined}
        className="relify-field h-11 w-full tracking-wide"
      />
    </div>
  );
}

function caretAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) {
    return 0;
  }

  let seen = 0;

  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? "")) {
      seen += 1;
      if (seen === digitCount) {
        return index + 1;
      }
    }
  }

  return formatted.length;
}
