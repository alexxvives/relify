"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  setSubscriptionCancelAction,
  startCardSetupAction,
  updateBillingEmailAction,
  type SubscriptionActionState,
} from "@/app/(app)/premium/actions";
import { AppToast } from "@/components/app-toast";
import { billingCopy } from "@/lib/billing-copy";
import type { SubscriptionDesk } from "@/server/subscriptionDesk";
import { Button, Card, Input } from "@/components/ui/form";

function Note({ state }: { state: SubscriptionActionState }) {
  if (!state) {
    return null;
  }

  if (state.ok) {
    return <AppToast message={state.message} />;
  }

  return (
    <p role="alert" className="text-sm text-red-700">
      {state.message}
    </p>
  );
}

export function SubscriptionDeskView({ desk, notice }: { desk: SubscriptionDesk; notice: string | null }) {
  const [cancelState, cancelAction, cancelPending] = useActionState(setSubscriptionCancelAction, null);
  const [emailState, emailAction, emailPending] = useActionState(updateBillingEmailAction, null);
  const [cardState, cardAction, cardPending] = useActionState(startCardSetupAction, null);
  const noticeTone = notice === billingCopy.cardSaved ? "ok" : "error";

  return (
    <div className="flex w-full flex-col gap-6">
      <AppToast message={notice} tone={noticeTone} />
      <Link href="/premium" className="text-sm font-medium text-[#465ab4]">
        {billingCopy.backToPlans}
      </Link>
      {desk.kind === "none" ? (
        <section className="rounded-2xl border border-[#e7eaee] bg-white px-6 py-10 text-center">
          <p className="text-sm text-[#5c6b78]">{billingCopy.noSubscription}</p>
          <Link href="/premium" className="mt-4 inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white">
            {billingCopy.seePlans}
          </Link>
        </section>
      ) : null}
      {desk.kind === "granted" ? (
        <Card className="p-6">
          <p className="text-lg font-semibold text-[#1c2740]">{desk.planLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{billingCopy.grantedPlan}</p>
        </Card>
      ) : null}
      {desk.kind === "stripe" ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
            <div className="bg-[#1c2740] px-6 py-6 text-white sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white/60">{billingCopy.yourPlan}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight">{desk.planLabel}</h3>
                  {desk.amountLabel ? <p className="mt-2 text-lg text-white/85">{desk.amountLabel}</p> : null}
                </div>
                <span
                  className={
                    desk.canceling
                      ? "rounded-full bg-[#fff4d6] px-3 py-1 text-xs font-semibold text-[#8a6112]"
                      : "rounded-full bg-[#e8f6ee] px-3 py-1 text-xs font-semibold text-[#17663a]"
                  }
                >
                  {desk.canceling ? billingCopy.endsOn : desk.statusLabel}
                </span>
              </div>
            </div>
            <div className="grid gap-6 p-6 text-center sm:grid-cols-3 sm:p-8">
              <div>
                <p className="text-xs font-semibold text-[#667085]">{billingCopy.renewsOn}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.whenLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#667085]">{billingCopy.periodStart}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.periodStart}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#667085]">{billingCopy.statusLabel}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.statusLabel}</p>
              </div>
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.cardLabel}</h3>
              <div className="mt-5 flex flex-col items-center">
                <PaymentCard brand={desk.cardBrand} last4={desk.cardLast4} expires={desk.cardExpires} />
                <form action={cardAction} className="mt-5 flex flex-col items-center gap-2">
                  <Button
                    type="submit"
                    disabled={cardPending}
                    className="rounded-full text-sm"
>
                    {cardPending ? billingCopy.changingCard : billingCopy.changeCard}
                  </Button>
                  <Note state={cardState} />
                </form>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.billingEmail}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5c6b78]">Las facturas se envían a este correo.</p>
              <form action={emailAction} className="mt-4 flex flex-col gap-3">
                <Input
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  defaultValue={desk.email}
                  aria-label={billingCopy.billingEmail}
                />
                <button
                  type="submit"
                  disabled={emailPending}
                  className="inline-flex h-11 w-fit items-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium disabled:opacity-60"
                >
                  {emailPending ? billingCopy.savingEmail : billingCopy.billingEmailSave}
                </button>
                <Note state={emailState} />
              </form>
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.invoicesTitle}</h3>
            {desk.invoices.length === 0 ? <p className="mt-3 text-sm text-[#5c6b78]">{billingCopy.invoicesEmpty}</p> : null}
            {desk.invoices.length > 0 ? (
              <div className="layout-table mt-4">
                <table className="text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#eef0f3] text-xs font-semibold text-[#667085]">
                      <th className="py-2 pr-3 font-semibold">Número</th>
                      <th className="py-2 pr-3 font-semibold">Fecha</th>
                      <th className="py-2 pr-3 font-semibold">Estado</th>
                      <th className="py-2 pr-3 font-semibold">Importe</th>
                      <th className="py-2 font-semibold">Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desk.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-[#f4f6f8]">
                        <td className="py-3 pr-3 font-medium text-[#1c2740]">{invoice.number}</td>
                        <td className="py-3 pr-3 text-[#3d4a63]">{invoice.date}</td>
                        <td className="py-3 pr-3 text-[#3d4a63]">
                          {invoice.status === "paid" ? billingCopy.invoicePaid : billingCopy.invoiceDue}
                        </td>
                        <td className="py-3 pr-3 font-medium text-[#1c2740]">{invoice.amount}</td>
                        <td className="py-3">
                          <span className="flex gap-3">
                            {invoice.href ? (
                              <a href={invoice.href} className="font-medium text-[#465ab4]">
                                {billingCopy.invoiceOpen}
                              </a>
                            ) : null}
                            {invoice.pdf ? (
                              <a href={invoice.pdf} className="font-medium text-[#465ab4]">
                                {billingCopy.invoicePdf}
                              </a>
                            ) : null}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
          <div className="flex flex-wrap items-start justify-center gap-3">
            <Link href="/premium" className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white">
              {billingCopy.changePlan}
            </Link>
            <form action={cancelAction} className="flex flex-col items-center gap-2">
              <input type="hidden" name="cancel" value={desk.canceling ? "0" : "1"} />
              <button
                type="submit"
                disabled={cancelPending}
                className={
                  desk.canceling
                    ? "inline-flex h-11 items-center rounded-full border border-[#d0d5dd] bg-white px-5 text-sm font-medium text-[#1c2740] disabled:opacity-60"
                    : "inline-flex h-11 items-center rounded-full bg-[#c0362c] px-5 text-sm font-medium text-white disabled:opacity-60"
                }
              >
                {cancelPending ? billingCopy.canceling : desk.canceling ? billingCopy.keepPlan : billingCopy.cancelPlan}
              </button>
              <Note state={cancelState} />
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PaymentCard({ brand, last4, expires }: { brand: string | null; last4: string | null; expires: string | null }) {
  const brandName = brand ?? "Tarjeta";
  const ending = last4 ?? "••••";

  return (
    <div className="relative aspect-[1.586/1] w-[20rem] max-w-full overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#243656_0%,#1c2740_38%,#3d4f86_72%,#465ab4_100%)] p-5 text-white shadow-[0_18px_36px_-24px_rgba(28,39,64,0.9)]">
      <div className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-[#8ea2ff]/20" />
      <div className="relative flex items-start justify-between">
        <span className="relative block h-9 w-12 overflow-hidden rounded-[6px] bg-[linear-gradient(160deg,#f8ecc8_0%,#d4b56a_45%,#a6853d_100%)] shadow-[inset_0_0_0_1px_rgba(90,64,16,0.25)]">
          <span className="absolute inset-x-1 top-2 h-px bg-[#8a7040]/70" />
          <span className="absolute inset-x-1 top-4 h-px bg-[#8a7040]/50" />
          <span className="absolute inset-y-1 left-4 w-px bg-[#8a7040]/50" />
        </span>
        <span className="text-lg tracking-wide italic">Relify</span>
      </div>
      <p className="relative mt-6 font-mono text-lg">{`••••  ••••  ••••  ${ending}`}</p>
      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-white/60">{billingCopy.cardExpires}</p>
          <p className="mt-1 text-sm tabular-nums">{expires ?? "—"}</p>
        </div>
        <p className="text-lg font-semibold tracking-[0.12em] uppercase">{brandName}</p>
      </div>
    </div>
  );
}
