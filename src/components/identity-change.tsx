"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Pencil, X } from "lucide-react";
import { requestIdentityChangeAction, type IdentityChangeState } from "@/app/(app)/mi-empresa/actions";
import { Input, Textarea } from "@/components/ui/form";
import { identityChangeMaxLength } from "@/lib/identity-change-email";

export type IdentityField = "legalName" | "cif";

const tooltip = "Verificado. Para cambiarlo, solicítalo";

/** t79: a verified, read-only identity field (nombre legal / NIF); the lock's tooltip says why it can't be edited. */
export function LockedIdentityInput({ name, value, onRequest }: { name: IdentityField; value: string; onRequest?: () => void }) {
  return (
    <div className="relative">
      <span className="group absolute top-1/2 left-3 z-10 -translate-y-1/2" tabIndex={0} aria-label={tooltip}>
        <Lock className="size-3.5 text-[#0f766e]" aria-hidden />
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full -left-2 mb-2 hidden rounded-md bg-[#1c2740] px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block group-focus:block"
        >
          {tooltip}
        </span>
      </span>
      <Input name={name} value={value} readOnly aria-readonly="true" title={value} className={`bg-[#f5f6f8] pl-8 text-[#3d4a63] ${onRequest ? "pr-10" : ""}`} />
      {onRequest ? (
        // t80: the change request is a compact icon inside the NIF field (no extra row under the cells).
        <button
          type="button"
          onClick={onRequest}
          aria-label="Solicitar cambio"
          title="Solicitar cambio"
          className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** t79: "Solicitar cambio" modal; sends dato actual / correcto / motivo to info@ (Maileroo transport). */
export function IdentityChangeDialog({
  field,
  values,
  onClose,
}: {
  field: IdentityField | null;
  values: Record<IdentityField, string>;
  onClose: () => void;
}) {
  if (!field || typeof document === "undefined") {
    return null;
  }
  // Portalled to <body>: the page's main <form> can't contain another form.
  return createPortal(<IdentityChangeModal initial={field} values={values} onClose={onClose} />, document.body);
}

function IdentityChangeModal({ initial, values, onClose }: { initial: IdentityField; values: Record<IdentityField, string>; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<IdentityChangeState, FormData>(requestIdentityChangeAction, null);
  const [chosen, setChosen] = useState<IdentityField>(initial);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="identity-change-title"
      onClose={onClose}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] open:block backdrop:bg-[#1c2740]/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="identity-change-title" className="text-lg font-semibold">Solicitar cambio</h2>
          <p className="mt-1 text-sm text-[#5c6b78]">El nombre legal y el NIF están verificados. Lo revisamos y te escribimos.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1 text-[#5c6b78] hover:bg-[#f1f4f8]">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {state?.ok ? (
        <p role="status" className="mt-5 rounded-xl bg-[#e6f6f4] px-4 py-3 text-sm font-medium text-[#0f766e]">
          {state.message}
        </p>
      ) : (
        <form action={action} className="mt-5 flex flex-col gap-4">
          <fieldset className="flex gap-2">
            <legend className="mb-1.5 text-sm font-medium">Dato</legend>
            {(["legalName", "cif"] as const).map((option) => (
              <label
                key={option}
                className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-3 text-sm font-medium has-focus-visible:ring-2 has-focus-visible:ring-[#2fc4b2] ${
                  chosen === option ? "border-[#1c2740] bg-[#1c2740] text-white" : "border-[#e6e9f0] text-[#3d4a63]"
                }`}
              >
                <input type="radio" name="field" value={option} checked={chosen === option} onChange={() => setChosen(option)} className="sr-only" />
                {option === "legalName" ? "Nombre legal" : "NIF"}
              </label>
            ))}
          </fieldset>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Dato actual
            <Input name="current" value={values[chosen]} readOnly className="bg-[#f5f6f8] text-[#3d4a63]" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Dato correcto
            <Input key={chosen} name="correct" required maxLength={identityChangeMaxLength} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Motivo
            <Textarea name="reason" rows={3} required minLength={5} maxLength={identityChangeMaxLength} placeholder="Por ejemplo: cambio de denominación social" />
          </label>
          {state && !state.ok ? (
            <p role="alert" className="text-sm font-medium text-[#b42318]">
              {state.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-full border border-[#e7eaee] px-4 text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center rounded-full bg-[#1c2740] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
