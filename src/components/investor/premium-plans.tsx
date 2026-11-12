"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { EyeIcon } from "@/components/ui/eye";
import { HeartHandshakeIcon } from "@/components/ui/heart-handshake";
import { HeartIcon } from "@/components/ui/heart";
import { CheckIcon } from "@/components/ui/check";
import { AppToast } from "@/components/shell/app-toast";
import { changeBuyerPlanAction, startBuyerPlanAction, type PlanActionState } from "@/app/(app)/premium/actions";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { ShellStickyCtaBar } from "@/components/ui/sticky-cta";
import { billingCopy } from "@/lib/billing-copy";
import type { BuyerPlanName } from "@/lib/billing";

function Note({ state }: { state: PlanActionState }) {
  if (!state) {
    return null;
  }

  return (
    <p className="text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

function PlanButton({ plan, label, change = false }: { plan: "limited" | "unlimited"; label: string; change?: boolean }) {
  // Subscribers switch plan in place (prorated); everyone else goes through Checkout.
  const [state, action, pending] = useActionState(change ? changeBuyerPlanAction : startBuyerPlanAction, null);

  return (
    <form action={action} className="mt-6 flex flex-col gap-2 max-lg:mt-0">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white disabled:opacity-60 lg:h-11"
      >
        {pending ? (change ? billingCopy.switching : billingCopy.choosing) : label}
      </button>
      <Note state={state} />
    </form>
  );
}

const plans = [
  {
    id: "none" as const,
    name: billingCopy.freeName,
    price: billingCopy.freePrice,
    gross: null,
    inherit: null,
    points: billingCopy.freePoints,
    icon: EyeIcon,
    wash: "bg-[#f4f6f8] text-[#5c6b78]",
    recommended: false,
  },
  {
    id: "limited" as const,
    name: billingCopy.limitedName,
    price: billingCopy.limitedPrice,
    gross: billingCopy.limitedGross,
    inherit: billingCopy.limitedInherit,
    points: billingCopy.limitedPoints,
    icon: HeartHandshakeIcon,
    wash: "bg-[#eef2ff] text-[#465ab4]",
    recommended: true,
  },
  {
    id: "unlimited" as const,
    name: billingCopy.unlimitedName,
    price: billingCopy.unlimitedPrice,
    gross: billingCopy.unlimitedGross,
    inherit: billingCopy.unlimitedInherit,
    points: billingCopy.unlimitedPoints,
    icon: HeartIcon,
    wash: "bg-[#f4f7ff] text-[#465ab4]",
    recommended: false,
  },
];

export function PremiumPlans({ plan, notice, testMode = false }: { plan: BuyerPlanName; notice: string | null; testMode?: boolean }) {
  const [yearly, setYearly] = useState(false);
  const current =
    plan === "limited" ? billingCopy.currentLimited : plan === "unlimited" ? billingCopy.currentUnlimited : billingCopy.currentFree;

  return (
    <div className="flex flex-col gap-8">
      <section
        className="relative overflow-hidden rounded-[2rem] px-6 py-10 text-center text-white sm:px-10"
        style={{
          background:
            "radial-gradient(90% 120% at 0% 0%, #8ea2ff 0%, #465ab4 32%, #1c2740 70%)",
        }}
      >
        <p className="text-xs font-semibold tracking-[0.22em] text-white/70 uppercase">Relify</p>
        <h2 className="releva-page-title mt-3 text-4xl leading-[1.05] sm:text-5xl">
          Mira gratis. Conecta cuando toque.
        </h2>
        <p className="mt-4 text-sm leading-6 text-white/80">{billingCopy.intro}</p>
        <p className="mx-auto mt-5 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium">{current}</p>
        {testMode ? (
          <p className="mx-auto mt-3 w-fit rounded-full bg-[#ffb703] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#1c2740] uppercase">
            {billingCopy.intTestMode}
          </p>
        ) : null}
        <AppToast message={notice} tone={notice === billingCopy.paid || notice === billingCopy.planChanged ? "ok" : "error"} />
      </section>
      <div className="flex justify-center">
        <div className="grid w-full max-w-sm grid-cols-2 rounded-full bg-[#1c2740] p-1 lg:inline-flex lg:w-auto lg:max-w-none" role="group" aria-label={billingCopy.periodLabel}>
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={!yearly ? "h-11 rounded-full bg-white px-4 text-sm font-semibold text-[#1c2740]" : "h-11 rounded-full px-4 text-sm text-white/70"}
          >
            {billingCopy.periodMonthly}
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={yearly ? "h-11 rounded-full bg-[#ffb703] px-4 text-sm font-semibold text-[#1c2740]" : "h-11 rounded-full px-4 text-sm text-white/70"}
          >
            {billingCopy.periodYearly}
          </button>
        </div>
      </div>
      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3" data-sticky-twin>
        {plans.map((item) => {
          const active = plan === item.id;
          const Icon = item.icon;
          return (
            <section
              key={item.id}
              className={
                active
                  ? "relative flex flex-col rounded-[2rem] border-2 border-[#17663a] bg-white p-6"
                  : item.recommended
                    ? "relative flex flex-col rounded-[2rem] border-2 border-[#465ab4] bg-white p-6"
                    : "relative flex flex-col rounded-[2rem] border border-[#e7eaee] bg-white p-6"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.wash}`}>
                  <Icon size={24} aria-hidden />
                </span>
                {active ? (
                  <span className="rounded-full bg-[#e8f6ee] px-3 py-1 text-xs font-semibold text-[#17663a]">{billingCopy.yourPlan}</span>
                ) : item.recommended ? (
                  <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#465ab4]">{billingCopy.recommended}</span>
                ) : null}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-[#1c2740]">{item.name}</h2>
              <p className="releva-page-title mt-3 text-5xl leading-none text-[#1c2740]">
                {yearly && item.id === "limited"
                  ? billingCopy.limitedYearly
                  : yearly && item.id === "unlimited"
                    ? billingCopy.unlimitedYearly
                    : item.price}
              </p>
              <p className="mt-2 text-sm text-[#667085]">
                {item.gross === null
                  ? billingCopy.freeBody
                  : yearly && item.id === "limited"
                    ? billingCopy.limitedYearlyGross
                    : yearly && item.id === "unlimited"
                      ? billingCopy.unlimitedYearlyGross
                      : item.gross}
              </p>
              {item.gross ? (
                <>
                  <p className="mt-1 text-xs text-[#8b95a7]">{billingCopy.vatNote}</p>
                  <div className="mt-2">
                    <CheckoutLegalNote />
                  </div>
                </>
              ) : null}
              {item.inherit ? <p className="mt-6 text-sm font-medium text-[#465ab4]">{item.inherit}</p> : null}
              <ul className={item.inherit ? "mt-3 flex flex-1 flex-col gap-3" : "mt-6 flex flex-1 flex-col gap-3"}>
                {item.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm">
                    <CheckIcon size={16} className="mt-0.5 shrink-0 text-[#17663a]" aria-hidden />
                    <span className="text-[#3d4a63]">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {item.id === "limited" && plan === "none" ? <PlanButton plan="limited" label={billingCopy.chooseLimited} /> : null}
                {item.id === "unlimited" && plan === "none" ? <PlanButton plan="unlimited" label={billingCopy.chooseUnlimited} /> : null}
                {!active && plan !== "none" && (item.id === "limited" || item.id === "unlimited") ? (
                  <PlanButton plan={item.id} label={billingCopy.switchPlan} change />
                ) : null}
                {active && plan !== "none" ? (
                  <Link
                    href="/premium/suscripcion"
                    className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium"
                  >
                    {billingCopy.manage}
                  </Link>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {plan === "none" ? (
        <>
          <ShellStickyCtaBar>
            <PlanButton plan="limited" label={billingCopy.chooseLimited} />
          </ShellStickyCtaBar>
        </>
      ) : null}
    </div>
  );
}
