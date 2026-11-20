"use client";

import { stepCtaClass } from "@/components/investor/step-cta";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { Check, X } from "lucide-react";
import { SignaturePad } from "@/components/investor/signature-pad";
import { useModalScrollLock } from "@/components/investor/file-preview-dialog";
import { platformTermsCopy } from "@/lib/platform-terms";
import {
  acceptAdvisorNdaAction,
  closeEngagementAction,
  declineEngagementAction,
  startAdvisorDepositAction,
} from "@/app/(app)/mandatos/encargos/actions";
import { engagementCopy } from "@/lib/engagement-copy";
import { keepUnsignedEuro } from "@/lib/numeric-input";
import { Button, Card, Input } from "@/components/ui/form";

/**
 * S36 (Alex): no deposit panel beside the encargo. Each locked section (and the Tu turno cue) has a Pagar depósito
 * button; it opens this popup with the breakdown, then Stripe Checkout. Rechazar stays inside the popup.
 */
export function AdvisorDepositButton({
  engagementId,
  amountLabel,
  priceLabel,
}: {
  engagementId: string;
  amountLabel: string;
  priceLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={stepCtaClass}
        data-advisor-deposit-button
      >
        {engagementCopy.depositPay}
      </button>
      {open ? (
        <AdvisorDepositDialog
          engagementId={engagementId}
          amountLabel={amountLabel}
          priceLabel={priceLabel}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function AdvisorDepositDialog({
  engagementId,
  amountLabel,
  priceLabel,
  onClose,
}: {
  engagementId: string;
  amountLabel: string;
  priceLabel: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(startAdvisorDepositAction, null);
  const [declineState, declineAction, declining] = useActionState(declineEngagementAction, null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  useModalScrollLock(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const rows = [
    { label: engagementCopy.depositRowAmount, value: amountLabel },
    { label: engagementCopy.depositRowFormula, value: engagementCopy.depositFormula.replace("{price}", priceLabel) },
    { label: engagementCopy.depositRowVat, value: engagementCopy.depositVat },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(44rem,calc(100%-2rem))] w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border-0 bg-white p-6 text-left text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
      onClose={onClose}
      data-advisor-deposit-dialog
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{engagementCopy.depositTitle}</h2>
        <form method="dialog">
          <button type="submit" aria-label="Cerrar" className="inline-flex size-9 items-center justify-center rounded-lg text-[#5c6b78] hover:bg-[#f2f4f7]">
            <X className="size-4" aria-hidden />
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{engagementCopy.depositBody}</p>
      <dl className="mt-4 overflow-hidden rounded-xl border border-[#e6eaf5]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 border-t border-[#e6eaf5] px-4 py-3 text-sm first:border-t-0">
            <dt className="text-[#5c6b78]">{row.label}</dt>
            <dd className="text-right font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 flex flex-col gap-2 text-sm leading-6 text-[#3d4a63]">
        {engagementCopy.depositPoints.map((point) => (
          <li key={point} className="flex gap-2">
            <Check className="mt-1 size-4 shrink-0 text-[#17663a]" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
      {confirmDecline ? (
        <div className="mt-5 rounded-xl bg-[#fff5f5] p-4">
          <p className="text-sm font-semibold">{engagementCopy.depositDeclineAsk}</p>
          <p className="mt-1 text-sm text-[#5c6b78]">{engagementCopy.depositDeclineAskBody}</p>
          <form action={declineAction} className="mt-3 flex justify-end gap-2">
            <input type="hidden" name="engagementId" value={engagementId} />
            <button type="button" onClick={() => setConfirmDecline(false)} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#5c6b78]">
              {engagementCopy.depositDeclineCancel}
            </button>
            <button type="submit" disabled={declining} className="inline-flex h-11 items-center rounded-full bg-[#b42318] px-4 text-sm font-medium text-white disabled:opacity-60">
              {declining ? engagementCopy.depositDeclining : engagementCopy.depositDecline}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDecline(true)}
            className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#b42318] disabled:opacity-60"
          >
            {engagementCopy.depositDecline}
          </button>
          <form action={action}>
            <input type="hidden" name="engagementId" value={engagementId} />
            <Button type="submit" disabled={pending} className="rounded-full text-sm">
              {pending ? engagementCopy.depositPaying : `${engagementCopy.depositPay} · ${amountLabel}`}
            </Button>
          </form>
        </div>
      )}
      <div className="mt-3">
        <CheckoutLegalNote />
      </div>
      {[state, declineState].map((result, index) =>
        result && !result.ok ? (
          <p key={index} role="alert" className="mt-3 text-sm text-red-700">
            {result.message}
          </p>
        ) : null,
      )}
    </dialog>
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
        <span className="text-sm leading-5 text-[#1c2740]">{engagementCopy.ndaTurn}</span>
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
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(44rem,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 text-left text-[#1c2740] open:flex backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Acuerdo de confidencialidad</h2>
          <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{engagementCopy.ndaIntro}</p>
        </div>
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

/** S36 (Alex): the advisor NDA opens as a popup (like the buyer's), from Tu turno or a locked section. */
export function AdvisorNdaButton({ engagementId, text }: { engagementId: string; text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={stepCtaClass}
        data-advisor-nda-button
      >
        {engagementCopy.ndaSign}
      </button>
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
