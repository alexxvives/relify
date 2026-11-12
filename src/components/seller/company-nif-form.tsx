"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  LockKeyhole,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import {
  previewCompanyNifAction,
  verifyCompanyNifAction,
  type VerifyNifState,
} from "@/app/(app)/mi-empresa/nif-actions";
import { companyCopy } from "@/lib/company-copy";
import { isValidSpanishCif } from "@/lib/spanish-cif";
import { FilledCheckIcon, WaitClockIcon } from "@/components/seller/nif-ready-icons";

const FILL_MS = 2200;

const notes = [
  {
    icon: LockKeyhole,
    title: companyCopy.nifConfidential,
    body: companyCopy.nifConfidentialBody,
  },
  {
    icon: Sparkles,
    title: companyCopy.nifAutofill,
    body: companyCopy.nifAutofillBody,
  },
  {
    icon: Shuffle,
    title: companyCopy.nifAlias,
    body: companyCopy.nifAliasBody,
  },
] as const;

/**
 * Stays mounted after the CIF is saved (active turns false on the refresh) so the
 * confirmation step is not torn down mid-read.
 */
export function CompanyNifDialog({ active = true }: { active?: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(true);
  const [state, action, pending] = useActionState<VerifyNifState, FormData>(
    verifyCompanyNifAction,
    null,
  );
  const [nif, setNif] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // "filling" holds at least FILL_MS so the step reads as deliberate, then "done" shows the check.
  const [phase, setPhase] = useState<"form" | "confirm" | "filling" | "done">("form");
  // t80: registry name behind the typed CIF ("¿Es esta tu empresa?"); null name = not found, failed = lookup down.
  const [match, setMatch] = useState<{ cif: string; legalName: string | null; failed: boolean } | null>(null);
  const [checking, startChecking] = useTransition();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "filling") {
      return;
    }
    const timer = setTimeout(() => {
      setMinElapsed(true);
    }, FILL_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "filling" || pending || !minElapsed || state === null) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- phase follows the server result
    setPhase(state.ok ? "done" : "form");
  }, [phase, pending, minElapsed, state]);

  const invalid = localMessage !== null || (state !== null && !state.ok);

  if (!active && phase === "form") {
    return null;
  }

  return (
    <>
      {open || phase === "done" ? null : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          className="mb-4 inline-flex h-11 items-center rounded-full bg-[#c0362c] px-4 text-sm font-semibold text-white"
        >
          {companyCopy.nifTitle}
        </button>
      )}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(44rem,calc(100%-2rem))] w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-0 bg-white p-6 text-[#1c2740] open:block backdrop:bg-[#1c2740]/40 sm:p-8"
        onClose={() => {
          setOpen(false);
        }}
      >
        {phase === "done" ? (
          <div role="status" aria-live="polite" className="py-2">
            <div className="flex flex-col items-center text-center">
              <span className="relative flex size-16">
                <span className="releva-ripple" aria-hidden />
              <span className="releva-check-pop relative flex size-16 items-center justify-center rounded-full bg-[#0f766e] text-white">
                <Check className="releva-check-draw size-9" strokeWidth={3} aria-hidden />
              </span>
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{companyCopy.nifReadyTitle}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5c6b78]">{companyCopy.nifReadyBody}</p>
            </div>
            <ol className="mt-6 grid gap-3">
              <li className="releva-row-in flex items-start gap-3 rounded-2xl border border-[#cfe8e4] bg-[#f0faf8] p-4" style={{ animationDelay: "350ms" }}>
                <FilledCheckIcon delayMs={550} />
                <span>
                  <span className="block text-sm font-semibold">{companyCopy.nifReadyBasics}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#5c6b78]">{companyCopy.nifReadyBasicsBody}</span>
                </span>
              </li>
              <li className="releva-row-in flex items-start gap-3 rounded-2xl border border-[#e1e6ee] bg-[#f7f8fb] p-4" style={{ animationDelay: "650ms" }}>
                <WaitClockIcon />
                <span>
                  <span className="block text-sm font-semibold">{companyCopy.nifReadyFinancials}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#5c6b78]">{companyCopy.nifReadyFinancialsBody}</span>
                </span>
              </li>
            </ol>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  // Stay on /mi-empresa: close and let the page show the pending-financials state.
                  setOpen(false);
                  router.refresh();
                }}
                className="inline-flex h-11 items-center rounded-xl bg-[#0f766e] px-5 text-sm font-semibold text-white"
              >
                {companyCopy.nifReadyContinue}
              </button>
            </div>
          </div>
        ) : phase === "confirm" && match ? (
          <div className="py-2">
            <span className="inline-flex items-center rounded-full bg-[#e6f4f1] px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
              {companyCopy.setupNifStep}
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {match.legalName ? "¿Es esta tu empresa?" : "Comprueba tu CIF"}
            </h2>
            <div className="mt-5 rounded-2xl border border-[#e1e6ee] bg-[#f7f8fb] p-5">
              {match.legalName ? (
                <p className="text-lg font-semibold break-words text-[#1c2740]">{match.legalName}</p>
              ) : null}
              <p className={`text-sm tracking-wider text-[#5c6b78] tabular-nums ${match.legalName ? "mt-1" : ""}`}>CIF {match.cif}</p>
              {match.legalName ? null : (
                <p className="mt-3 text-sm leading-6 text-[#5c6b78]">
                  {match.failed
                    ? "Ahora mismo no podemos consultar el registro mercantil para mostrarte el nombre. Revisa que el CIF es el de tu empresa antes de continuar."
                    : "No encontramos ninguna empresa con este CIF en el registro mercantil. Revisa que está bien escrito antes de continuar."}
                </p>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#5c6b78]">Después el nombre y el CIF quedan fijados en tu ficha.</p>
            <form
              action={action}
              className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
              onSubmit={() => {
                setMinElapsed(false);
                setPhase("filling");
              }}
            >
              <input type="hidden" name="nif" value={match.cif} />
              <button
                type="button"
                onClick={() => {
                  setPhase("form");
                  setMatch(null);
                  setAttempt((current) => current + 1);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d5dbe3] bg-white px-5 text-sm font-semibold text-[#1c2740] hover:bg-[#f7f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
              >
                No, corregir CIF
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 text-sm font-semibold text-white hover:bg-[#0c5f59] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e] disabled:opacity-60"
              >
                {match.legalName ? "Sí, es mi empresa" : "Sí, el CIF es correcto"}
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        ) : phase === "filling" ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-80 flex-col items-center justify-center text-center"
          >
            {phase === "filling" ? (
              <LoaderCircle
                className="size-14 animate-spin text-[#0f766e]"
                aria-hidden
              />
            ) : (
              <span className="releva-check-pop flex size-16 items-center justify-center rounded-full bg-[#1f8a5b] text-white">
                <Check
                  className="releva-check-draw size-9"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
            )}
            <p className="mt-6 text-xl font-semibold tracking-tight">
              {phase === "filling"
                ? companyCopy.nifFilling
                : companyCopy.nifFilled}
            </p>
            <p className="mt-2 text-sm text-[#5c6b78]">
              {phase === "filling"
                ? companyCopy.nifFillingBody
                : companyCopy.nifFilledBody}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#e6f4f1] px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
                  {companyCopy.setupNifStep}
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {companyCopy.nifTitle}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#5c6b78]">
                  {companyCopy.nifIntro}
                </p>
              </div>
              <form method="dialog">
                <button
                  type="submit"
                  aria-label="Cerrar"
                  className="-mt-1 -mr-1 flex size-9 items-center justify-center rounded-full text-[#5c6b78] transition hover:bg-[#f1f4f8] hover:text-[#1c2740] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </form>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {notes.map((note) => (
                <li key={note.title} className="flex flex-col items-center rounded-2xl border border-[#e7eaee] bg-[#f8fafc] px-4 py-4 text-center sm:py-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#0f766e] shadow-[0_1px_2px_rgba(28,39,64,0.08)] ring-1 ring-[#e1e6ee]">
                    <note.icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#1c2740]">{note.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#5c6b78]">
                    {note.body}
                  </p>
                </li>
              ))}
            </ul>
            <form
              action={action}
              className="mt-6 border-t border-[#eef1f5] pt-6"
              onSubmit={(event) => {
                if (!isValidSpanishCif(nif)) {
                  event.preventDefault();
                  setLocalMessage(
                    nif.trim().length === 0
                      ? companyCopy.nifRequired
                      : companyCopy.nifInvalid,
                  );
                  setAttempt((current) => current + 1);
                  return;
                }
                event.preventDefault();
                startChecking(async () => {
                  const result = await previewCompanyNifAction(nif);
                  if (result.ok) {
                    setMatch({ cif: result.cif, legalName: result.legalName, failed: false });
                    setPhase("confirm");
                  } else if (result.lookupFailed) {
                    setMatch({ cif: nif.trim(), legalName: null, failed: true });
                    setPhase("confirm");
                  } else {
                    setLocalMessage(result.message);
                    setAttempt((current) => current + 1);
                  }
                });
              }}
            >
              <label
                className="block text-sm font-medium"
                htmlFor="company-nif"
              >
                {companyCopy.nifLabel}
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="company-nif"
                  name="nif"
                  value={nif}
                  autoComplete="off"
                  spellCheck={false}
                  required
                  maxLength={12}
                  placeholder="B12345678"
                  aria-invalid={invalid}
                  onChange={(event) => {
                    setNif(event.target.value.toUpperCase());
                    setLocalMessage(null);
                  }}
                  className={
                    invalid
                      ? "releva-shake h-12 w-full min-w-0 shrink-0 rounded-xl sm:w-auto sm:flex-1 border-2 border-[#c0362c] bg-[#fff6f6] px-4 text-base tracking-wider outline-none"
                      : "h-12 w-full min-w-0 shrink-0 rounded-xl sm:w-auto sm:flex-1 border border-[#d5dbe3] bg-white px-4 text-base tracking-wider outline-none transition placeholder:text-[#a3adb8] focus-visible:border-[#0f766e] focus-visible:ring-4 focus-visible:ring-[#0f766e]/15"
                  }
                  key={attempt}
                />
                <button
                  type="submit"
                  disabled={pending || checking}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1c2740] px-5 text-sm font-semibold text-white transition hover:bg-[#28375a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e] disabled:opacity-60"
                >
                  {pending || checking ? companyCopy.nifPending : companyCopy.nifSubmit}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
              {localMessage || (state && !state.ok) ? (
                <p role="alert" className="mt-2 text-sm text-[#c0362c]">
                  {localMessage ?? (state && !state.ok ? state.message : "")}
                </p>
              ) : null}
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
