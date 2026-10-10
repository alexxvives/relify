"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import {
  setSubscriptionCancelAction,
  startCardSetupAction,
  updateBillingEmailAction,
  type SubscriptionActionState,
} from "@/app/premium/actions";
import { AppToast } from "@/components/app-toast";
import { billingCopy } from "@/lib/billing-copy";
import type { SubscriptionDesk } from "@/server/subscriptionDesk";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <AppToast message={notice} tone={noticeTone} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/premium" className="text-sm font-medium text-[#465ab4]">
            {billingCopy.backToPlans}
          </Link>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1c2740]">{billingCopy.manageTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c6b78]">{billingCopy.manageIntro}</p>
        </div>
      </div>
      {desk.kind === "none" ? (
        <section className="rounded-3xl border border-[#e7eaee] bg-white px-6 py-10 text-center">
          <p className="text-sm text-[#5c6b78]">{billingCopy.noSubscription}</p>
          <Link href="/premium" className="mt-4 inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white">
            {billingCopy.seePlans}
          </Link>
        </section>
      ) : null}
      {desk.kind === "granted" ? (
        <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
          <p className="text-lg font-semibold text-[#1c2740]">{desk.planLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{billingCopy.grantedPlan}</p>
        </section>
      ) : null}
      {desk.kind === "stripe" ? (
        <>
          <section className="overflow-hidden rounded-3xl border border-[#e7eaee] bg-white">
            <div className="bg-[#1c2740] px-6 py-6 text-white sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-white/60 uppercase">{billingCopy.yourPlan}</p>
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
            <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{billingCopy.renewsOn}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.whenLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{billingCopy.periodStart}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.periodStart}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{billingCopy.statusLabel}</p>
                <p className="mt-1 text-base font-medium text-[#1c2740]">{desk.statusLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] px-6 py-4 sm:px-8">
              <Link href="/premium" className="text-sm font-medium text-[#465ab4]">
                {billingCopy.changePlan}
              </Link>
              <form action={cancelAction} className="flex flex-col items-end gap-2">
                <input type="hidden" name="cancel" value={desk.canceling ? "0" : "1"} />
                <button
                  type="submit"
                  disabled={cancelPending}
                  className="inline-flex h-10 items-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium text-[#1c2740] disabled:opacity-60"
                >
                  {cancelPending ? billingCopy.canceling : desk.canceling ? billingCopy.keepPlan : billingCopy.cancelPlan}
                </button>
                <Note state={cancelState} />
              </form>
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
              <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.cardLabel}</h3>
              <div className="mt-4 rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,#8ea2ff_0%,#465ab4_42%,#1c2740_78%)] px-5 py-5 text-white">
                <CreditCard className="size-6" aria-hidden />
                <p className="mt-6 text-lg font-medium tracking-wide">{desk.card ?? billingCopy.cardMissing}</p>
                {desk.cardExpires ? (
                  <p className="mt-1 text-sm text-white/75">
                    {billingCopy.cardExpires} {desk.cardExpires}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5c6b78]">{billingCopy.cardNote}</p>
              <form action={cardAction} className="mt-4 flex flex-col items-start gap-2">
                <button
                  type="submit"
                  disabled={cardPending}
                  className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
                >
                  {cardPending ? billingCopy.changingCard : billingCopy.changeCard}
                </button>
                <Note state={cardState} />
              </form>
            </section>
            <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
              <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.billingEmail}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5c6b78]">Las facturas se envían a este correo.</p>
              <form action={emailAction} className="mt-4 flex flex-col gap-3">
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  defaultValue={desk.email}
                  aria-label={billingCopy.billingEmail}
                  className="h-11 rounded-[14px] border border-[#e7eaee] px-3"
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
            </section>
          </div>
          <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
            <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.invoicesTitle}</h3>
            {desk.invoices.length === 0 ? <p className="mt-3 text-sm text-[#5c6b78]">{billingCopy.invoicesEmpty}</p> : null}
            {desk.invoices.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#eef0f3] text-xs font-semibold tracking-wide text-[#667085] uppercase">
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
          </section>
        </>
      ) : null}
    </div>
  );
}
