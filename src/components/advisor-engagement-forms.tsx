"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AgreementSheet } from "@/components/agreement-sheet";
import { documentDeskClass, useModalScrollLock } from "@/components/file-preview-dialog";
import { advisorCopy } from "@/lib/advisor-copy";
import {
  acceptAdvisorNdaAction,
  closeEngagementAction,
  declineEngagementAction,
  startAdvisorDepositAction,
} from "@/app/mandatos/encargos/actions";
import { engagementCopy } from "@/lib/engagement-copy";
import { keepUnsignedEuro } from "@/lib/numeric-input";

export function AdvisorDepositForm({ engagementId, amountLabel }: { engagementId: string; amountLabel: string }) {
  const [state, action, pending] = useActionState(startAdvisorDepositAction, null);
  const [declineState, declineAction, declining] = useActionState(declineEngagementAction, null);
  const [open, setOpen] = useState(true);
  const declineDialog = useRef<HTMLDialogElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e7eaee] bg-white px-4 py-3 text-left shadow-[0_18px_40px_-24px_rgba(28,39,64,0.55)]"
        aria-label="Mostrar depósito"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold tracking-[0.14em] text-[#667085] uppercase">
            {engagementCopy.depositTitle}
          </span>
          <span className="mt-1 block truncate text-base font-semibold text-[#1c2740]">{amountLabel}</span>
        </span>
        <ChevronUp className="size-4 shrink-0 text-[#465ab4]" aria-hidden />
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5 shadow-[0_18px_40px_-24px_rgba(28,39,64,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#2b3b4a]">{engagementCopy.depositTitle}</h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f4f6f8] text-[#1c2740]"
          aria-label="Ocultar depósito"
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{engagementCopy.depositBody}</p>
      <p className="mt-4 text-center text-3xl font-semibold tracking-tight text-[#1c2740]">{amountLabel}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <form action={action}>
          <input type="hidden" name="engagementId" value={engagementId} />
          <button
            type="submit"
            disabled={pending || declining}
            className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? engagementCopy.depositPaying : engagementCopy.depositPay}
          </button>
        </form>
        <button
          type="button"
          disabled={pending || declining}
          onClick={() => {
            declineDialog.current?.showModal();
          }}
          className="inline-flex h-11 items-center rounded-full bg-[#b42318] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {engagementCopy.depositDecline}
        </button>
      </div>
      {state && !state.ok ? (
        <p role="alert" className="mt-3 text-center text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      {declineState && !declineState.ok ? (
        <p role="alert" className="mt-3 text-center text-sm text-red-700">
          {declineState.message}
        </p>
      ) : null}
      <dialog
        ref={declineDialog}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] open:block backdrop:bg-[#1c2740]/40"
      >
        <h3 className="text-lg font-semibold text-[#1c2740]">{engagementCopy.depositDeclineAsk}</h3>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{engagementCopy.depositDeclineAskBody}</p>
        <form action={declineAction} className="mt-5 flex items-center justify-end gap-2">
          <input type="hidden" name="engagementId" value={engagementId} />
          <button
            type="button"
            onClick={() => {
              declineDialog.current?.close();
            }}
            className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#5c6b78]"
          >
            {engagementCopy.depositDeclineCancel}
          </button>
          <button
            type="submit"
            disabled={declining || pending}
            className="inline-flex h-11 items-center rounded-full bg-[#b42318] px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {declining ? engagementCopy.depositDeclining : engagementCopy.depositDecline}
          </button>
        </form>
      </dialog>
    </section>
  );
}

export function AdvisorNdaTurn({ engagementId, text }: { engagementId: string; text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-[#b42318] uppercase">
          Tu turno
        </span>
        <span className="text-sm leading-5 text-[#1c2740]">{advisorCopy.signNda}</span>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#17663a] px-3 text-sm font-semibold text-white"
        >
          Firmar
        </button>
      </span>
      {open ? (
        <AdvisorNdaDialog
          engagementId={engagementId}
          text={text}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function AdvisorNdaDialog({
  engagementId,
  text,
  onClose,
}: {
  engagementId: string;
  text: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState(acceptAdvisorNdaAction, null);
  useModalScrollLock(true);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, []);

  useEffect(() => {
    if (!state?.ok) {
      return;
    }

    dialogRef.current?.close();
    router.refresh();
  }, [router, state]);

  return (
    <dialog ref={dialogRef} className={documentDeskClass} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-sm font-medium">Acuerdo-de-confidencialidad.pdf</p>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-white/80">
            Cerrar
          </button>
        </form>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto max-w-3xl bg-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]">
          <AgreementSheet text={text} />
        </div>
      </div>
      <form action={action} className="flex flex-col items-center gap-2 border-t border-white/10 px-4 py-3">
        <input type="hidden" name="engagementId" value={engagementId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? engagementCopy.ndaPending : engagementCopy.ndaSign}
        </button>
        {state && !state.ok ? (
          <p role="alert" className="text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
      </form>
    </dialog>
  );
}

export function AdvisorNdaForm({ engagementId, text }: { engagementId: string; text: string }) {
  const [state, action, pending] = useActionState(acceptAdvisorNdaAction, null);

  return (
    <section id="nda" className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <p className="text-xs font-semibold tracking-[0.12em] text-[#b42318] uppercase">Tu turno</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.ndaTitle}</h2>
      <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.ndaInvestorNote}</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f7f8fb] p-4 text-sm leading-6 text-[#1c2740]">{text}</pre>
      <form action={action} className="mt-4 flex flex-col items-start gap-2">
        <input type="hidden" name="engagementId" value={engagementId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? engagementCopy.ndaPending : engagementCopy.ndaSign}
        </button>
        {state ? (
          <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export function AdvisorCloseForm({
  engagementId,
  closed,
  feeLabel,
}: {
  engagementId: string;
  closed: boolean;
  feeLabel: string | null;
}) {
  const [state, action, pending] = useActionState(closeEngagementAction, null);

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.closeJob}</h2>
      <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.closeJobHint}</p>
      {closed ? (
        <p className="mt-3 text-sm text-[#17663a]">
          {engagementCopy.feeStored}
          {feeLabel ? ` ${feeLabel}.` : ""}
        </p>
      ) : (
        <form action={action} className="mt-4 flex flex-col items-start gap-2">
          <label className="text-sm">
            {engagementCopy.chargedLabel}
            <input
              name="price"
              required
              inputMode="decimal"
              onChange={keepEuro}
              className="mt-1 h-11 rounded-xl border border-[#d0d5dd] px-3"
            />
          </label>
          <input type="hidden" name="engagementId" value={engagementId} />
          <button type="submit" disabled={pending} className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-4 text-sm">
            {pending ? "Guardando…" : engagementCopy.closeJob}
          </button>
          {state ? (
            <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
              {state.message}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

function keepEuro(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.value = keepUnsignedEuro(event.currentTarget.value);
}
