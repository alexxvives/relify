"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  setSubscriptionCancelAction,
  startCardSetupAction,
  updateBillingEmailAction,
  type SubscriptionActionState,
} from "@/app/premium/actions";
import { billingCopy } from "@/lib/billing-copy";
import type { SubscriptionDesk } from "@/server/subscriptionDesk";

function Note({ state }: { state: SubscriptionActionState }) {
  if (!state) {
    return null;
  }

  return (
    <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"}>
      {state.message}
    </p>
  );
}

export function SubscriptionDeskView({ desk, notice }: { desk: SubscriptionDesk; notice: string | null }) {
  const [cancelState, cancelAction, cancelPending] = useActionState(setSubscriptionCancelAction, null);
  const [emailState, emailAction, emailPending] = useActionState(updateBillingEmailAction, null);
  const [cardState, cardAction, cardPending] = useActionState(startCardSetupAction, null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/premium" className="text-sm font-medium text-[#465ab4]">
          {billingCopy.backToPlans}
        </Link>
        <h2 className="mt-3 text-3xl font-semibold text-[#1c2740]">{billingCopy.manageTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{billingCopy.manageIntro}</p>
      </div>
      {notice ? (
        <p role="status" className="rounded-2xl bg-[#e8f6ee] px-4 py-3 text-sm font-medium text-[#17663a]">
          {notice}
        </p>
      ) : null}
      {desk.kind === "none" ? <p className="text-sm text-[#5c6b78]">{billingCopy.noSubscription}</p> : null}
      {desk.kind === "granted" ? (
        <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
          <p className="text-lg font-semibold text-[#1c2740]">{desk.planLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{billingCopy.grantedPlan}</p>
        </section>
      ) : null}
      {desk.kind === "stripe" ? (
        <>
          <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
            <p className="text-lg font-semibold text-[#1c2740]">{desk.planLabel}</p>
            <p className="mt-2 text-sm text-[#3d4a63]">
              {desk.canceling ? billingCopy.endsOn : billingCopy.renewsOn} {desk.whenLabel}
            </p>
            <form action={cancelAction} className="mt-5 flex flex-col items-start gap-2">
              <input type="hidden" name="cancel" value={desk.canceling ? "0" : "1"} />
              <button
                type="submit"
                disabled={cancelPending}
                className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {cancelPending ? billingCopy.canceling : desk.canceling ? billingCopy.keepPlan : billingCopy.cancelPlan}
              </button>
              <Note state={cancelState} />
            </form>
          </section>
          <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
            <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.cardLabel}</h3>
            <p className="mt-2 text-sm text-[#3d4a63]">{desk.card ?? billingCopy.cardMissing}</p>
            <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{billingCopy.cardNote}</p>
            <form action={cardAction} className="mt-4 flex flex-col items-start gap-2">
              <button
                type="submit"
                disabled={cardPending}
                className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium disabled:opacity-60"
              >
                {cardPending ? billingCopy.changingCard : billingCopy.changeCard}
              </button>
              <Note state={cardState} />
            </form>
            <form action={emailAction} className="mt-6 flex flex-col gap-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1c2740]">
                {billingCopy.billingEmail}
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  defaultValue={desk.email}
                  className="h-11 rounded-[14px] border border-[#e7eaee] px-3 font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={emailPending}
                className="inline-flex h-11 w-fit items-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium disabled:opacity-60"
              >
                {emailPending ? billingCopy.canceling : billingCopy.billingEmailSave}
              </button>
              <Note state={emailState} />
            </form>
          </section>
          <section className="rounded-3xl border border-[#e7eaee] bg-white p-6">
            <h3 className="text-base font-semibold text-[#1c2740]">{billingCopy.invoicesTitle}</h3>
            {desk.invoices.length === 0 ? <p className="mt-3 text-sm text-[#5c6b78]">{billingCopy.invoicesEmpty}</p> : null}
            <ul className="mt-3 flex flex-col">
              {desk.invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 border-t border-[#eef0f3] py-3 text-sm">
                  <span className="text-[#3d4a63]">{invoice.date}</span>
                  <span className="font-medium text-[#1c2740]">{invoice.amount}</span>
                  {invoice.href ? (
                    <a href={invoice.href} className="font-medium text-[#465ab4]">
                      {billingCopy.invoiceOpen}
                    </a>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
