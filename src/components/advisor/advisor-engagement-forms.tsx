"use client";

import { stepCtaClass } from "@/components/investor/step-cta";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SignaturePad } from "@/components/investor/signature-pad";
import { useModalScrollLock } from "@/components/investor/file-preview-dialog";
import { platformTermsCopy } from "@/lib/platform-terms";
import { advisorCopy } from "@/lib/advisor-copy";
import {
  acceptAdvisorNdaAction,
  closeEngagementAction,
  declineEngagementAction,
  startAdvisorDepositAction,
  startInboxCheckoutAction,
} from "@/app/(app)/mandatos/encargos/actions";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { engagementCopy } from "@/lib/engagement-copy";
import { keepUnsignedEuro } from "@/lib/numeric-input";
import { Button, Card, Input } from "@/components/ui/form";

function AdvisorSubscriptionStep({ engagementId, disabled }: { engagementId: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(startInboxCheckoutAction, null);

  return (
    <div className="mt-4 rounded-xl border border-[#d9e2f2] bg-[#f5f7ff] p-4">
      <p className="text-sm font-semibold text-[#1c2740]">{engagementCopy.subscriptionTitle}</p>
      <p className="mt-1 text-sm leading-6 text-[#475569]">{engagementCopy.subscriptionBody}</p>
      <form action={action} className="mt-3 flex justify-center">
        <input type="hidden" name="engagementId" value={engagementId} />
        <Button
          type="submit"
          disabled={pending || disabled}
          className="rounded-full text-sm"
>
          {pending ? engagementCopy.subscriptionStarting : engagementCopy.subscriptionStart}
        </Button>
      </form>
      <div className="mt-3">
        <CheckoutLegalNote />
      </div>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 text-center text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function AdvisorDepositForm({
  engagementId,
  amountLabel,
  subscriptionActive,
}: {
  engagementId: string;
  amountLabel: string;
  subscriptionActive: boolean;
}) {
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
          <span className="block text-xs font-semibold text-[#667085]">
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
      {subscriptionActive ? null : <AdvisorSubscriptionStep engagementId={engagementId} disabled={declining} />}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <form action={action} className={subscriptionActive ? "" : "hidden"}>
          <input type="hidden" name="engagementId" value={engagementId} />
          <Button
            type="submit"
            disabled={pending || declining}
            className="rounded-full text-sm"
>
            {pending ? engagementCopy.depositPaying : engagementCopy.depositPay}
          </Button>
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
        <span className="shrink-0 rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#b42318]">
          Tu turno
        </span>
        <span className="text-sm leading-5 text-[#1c2740]">{advisorCopy.signNda}</span>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
          className={stepCtaClass}
        >
          Firmar NDA
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
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);
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
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(44rem,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
        <h2 className="text-lg font-semibold">Acuerdo de confidencialidad</h2>
        <form method="dialog">
          <button type="submit" className="text-sm font-medium text-[#5c6b78]">
            Cerrar
          </button>
        </form>
      </div>
      <form
        action={action}
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          if (signature.length === 0) {
            event.preventDefault();
            setNeedsSignature(false);
            window.requestAnimationFrame(() => {
              setNeedsSignature(true);
            });
          }
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm leading-6 text-[#3d4a63]">{text}</pre>
          <div className="mt-5">
            <input type="hidden" name="signature" value={signature} />
            <SignaturePad
              invalid={needsSignature}
              collectIdentity
              onChange={(value) => {
                setSignature(value);
                if (value.length > 0) {
                  setNeedsSignature(false);
                }
              }}
            />
            {needsSignature ? (
              <p role="alert" className="mt-2 text-sm text-[#c0362c]">
                {platformTermsCopy.signRequired}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end border-t border-[#eef0f3] px-5 py-4">
          <input type="hidden" name="engagementId" value={engagementId} />
          <Button
            type="submit"
            disabled={pending}
            className="rounded-full text-sm"
>
            {pending ? engagementCopy.ndaPending : engagementCopy.ndaSign}
          </Button>
        </div>
        {state && !state.ok ? (
          <p role="alert" className="px-5 pb-4 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
      </form>
    </dialog>
  );
}

export function AdvisorNdaForm({ engagementId, text }: { engagementId: string; text: string }) {
  const [state, action, pending] = useActionState(acceptAdvisorNdaAction, null);
  const [signature, setSignature] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);

  return (
    <Card id="nda">
      <p className="text-xs font-semibold text-[#b42318]">Tu turno</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.ndaTitle}</h2>
      <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.ndaInvestorNote}</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f7f8fb] p-4 text-sm leading-6 text-[#1c2740]">{text}</pre>
      <form
        action={action}
        className="mt-4 flex flex-col items-start gap-2"
        onSubmit={(event) => {
          if (signature.length === 0) {
            event.preventDefault();
            setNeedsSignature(false);
            window.requestAnimationFrame(() => {
              setNeedsSignature(true);
            });
          }
        }}
      >
        <input type="hidden" name="engagementId" value={engagementId} />
        <input type="hidden" name="signature" value={signature} />
        <SignaturePad
          invalid={needsSignature}
          collectIdentity
          onChange={(value) => {
            setSignature(value);
            if (value.length > 0) {
              setNeedsSignature(false);
            }
          }}
        />
        {needsSignature ? <p className="text-sm text-[#c0362c]">{platformTermsCopy.signRequired}</p> : null}
        <Button
          type="submit"
          disabled={pending}
          className="rounded-full text-sm"
>
          {pending ? engagementCopy.ndaPending : engagementCopy.ndaSign}
        </Button>
        {state ? (
          <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </Card>
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
    <Card>
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
            <Input
              name="price"
              required
              inputMode="decimal"
              onChange={keepEuro}
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
    </Card>
  );
}

function keepEuro(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.value = keepUnsignedEuro(event.currentTarget.value);
}
