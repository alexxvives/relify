"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  LoaderCircle,
  LockKeyhole,
  Shuffle,
  Sparkles,
} from "lucide-react";
import {
  verifyCompanyNifAction,
  type VerifyNifState,
} from "@/app/(app)/mi-empresa/nif-actions";
import { companyCopy } from "@/lib/company-copy";
import { isValidSpanishCif } from "@/lib/spanish-cif";
import { FilledCheckIcon, WaitClockIcon } from "@/components/nif-ready-icons";

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
  const [phase, setPhase] = useState<"form" | "filling" | "done">("form");
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

  useEffect(() => {
    if (phase !== "done") {
      return;
    }
    router.prefetch("/mi-empresa/detalles?alta=1");
  }, [phase, router]);

  const invalid = localMessage !== null || (state !== null && !state.ok);

  if (!active && phase === "form") {
    return null;
  }

  return (
    <>
      {open ? null : (
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
                  router.push("/mi-empresa/detalles?alta=1");
                }}
                className="inline-flex h-11 items-center rounded-xl bg-[#0f766e] px-5 text-sm font-semibold text-white"
              >
                {companyCopy.nifReadyContinue}
              </button>
            </div>
          </div>
        ) : phase === "filling" ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-80 flex-col items-center justify-center text-center"
          >
            {phase === "filling" ? (
              <LoaderCircle
                className="size-14 animate-spin text-[#3d34b8]"
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
                <h2 className="text-2xl font-semibold tracking-tight">
                  {companyCopy.nifTitle}
                </h2>
                <p className="mt-1 text-xs font-medium text-[#5c6b78]">
                  {companyCopy.setupNifStep}
                </p>
                <p className="mt-2 text-sm text-[#5c6b78]">
                  {companyCopy.nifIntro}
                </p>
              </div>
              <form method="dialog">
                <button
                  type="submit"
                  className="text-sm font-medium text-[#5c6b78]"
                >
                  Cerrar
                </button>
              </form>
            </div>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {notes.map((note) => (
                <li key={note.title} className="rounded-2xl bg-[#f7f8fb] p-4">
                  <note.icon className="size-5 text-[#3d34b8]" aria-hidden />
                  <p className="mt-3 text-sm font-medium">{note.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#5c6b78]">
                    {note.body}
                  </p>
                </li>
              ))}
            </ul>
            <form
              action={action}
              className="mt-6"
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
                setMinElapsed(false);
                setPhase("filling");
              }}
            >
              <label
                className="block text-sm font-medium"
                htmlFor="company-nif"
              >
                {companyCopy.nifLabel}
              </label>
              <input
                id="company-nif"
                name="nif"
                value={nif}
                autoComplete="off"
                required
                aria-invalid={invalid}
                onChange={(event) => {
                  setNif(event.target.value.toUpperCase());
                  setLocalMessage(null);
                }}
                className={
                  invalid
                    ? "releva-shake mt-2 h-12 w-full rounded-xl border-2 border-[#c0362c] bg-[#fff6f6] px-3 text-sm outline-none"
                    : "mt-2 h-12 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 text-sm outline-none focus-visible:border-[#5c4de0]"
                }
                key={attempt}
              />
              {localMessage || (state && !state.ok) ? (
                <p role="alert" className="mt-2 text-sm text-[#c0362c]">
                  {localMessage ?? (state && !state.ok ? state.message : "")}
                </p>
              ) : null}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
                >
                  {pending ? companyCopy.nifPending : companyCopy.nifSubmit}
                </button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
