"use client";

import { useState, type FormEvent } from "react";
import { isValidSpanishCif, normalizeCif } from "@/lib/spanish-cif";

const copy = {
  label: "CIF de la sociedad",
  placeholder: "B12345674",
  button: "Valorar",
  invalid: "El número final del CIF no es correcto. Verifica el CIF.",
  soon: "La valoración todavía no está abierta. El CIF tiene forma válida y no lo hemos guardado.",
  privacy: "No buscamos la sociedad ni guardamos el CIF. Cuando la valoración abra, el resultado saldrá de las cuentas, no del nombre.",
} as const;

export function ValuationSoon() {
  const [cif, setCif] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidSpanishCif(cif)) {
      setInvalid(true);
      setMessage(copy.invalid);
      return;
    }

    setInvalid(false);
    setMessage(copy.soon);
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-xl" noValidate>
      <label className="flex flex-col gap-2 text-sm font-medium">
        {copy.label}
        <input
          name="cif"
          value={cif}
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          placeholder={copy.placeholder}
          aria-invalid={invalid}
            onChange={(event) => {
            setCif(normalizeCif(event.target.value));
            setInvalid(false);
            setMessage(null);
          }}
          className="h-12 rounded-full border border-public-line bg-white px-4 text-base tracking-wide outline-none focus-visible:border-public-ink"
        />
      </label>
      <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-public-ink px-6 text-white sm:w-auto">
        {copy.button}
      </button>
      <p className={invalid ? "mt-4 text-sm text-red-700" : "mt-4 text-sm leading-6 text-public-muted"} role={invalid ? "alert" : "status"}>
        {message ?? copy.privacy}
      </p>
    </form>
  );
}
