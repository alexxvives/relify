"use client";

import { useActionState, useState } from "react";
import { Check, Crown, Eye, Handshake } from "lucide-react";
import { openBillingPortalAction, startBuyerPlanAction, type PlanActionState } from "@/app/premium/actions";
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

function PlanButton({ plan, label, featured }: { plan: "limited" | "unlimited"; label: string; featured?: boolean }) {
  const [state, action, pending] = useActionState(startBuyerPlanAction, null);

  return (
    <form action={action} className="mt-6 flex flex-col gap-2">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        disabled={pending}
        className={
          featured
            ? "inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#465ab4] disabled:opacity-60"
            : "inline-flex h-11 items-center justify-center rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white disabled:opacity-60"
        }
      >
        {pending ? billingCopy.choosing : label}
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
    points: billingCopy.freePoints,
    icon: Eye,
    wash: "bg-[#f4f6f8] text-[#5c6b78]",
  },
  {
    id: "limited" as const,
    name: billingCopy.limitedName,
    price: billingCopy.limitedPrice,
    gross: billingCopy.limitedGross,
    points: billingCopy.limitedPoints,
    icon: Handshake,
    wash: "bg-[#eef2ff] text-[#465ab4]",
  },
  {
    id: "unlimited" as const,
    name: billingCopy.unlimitedName,
    price: billingCopy.unlimitedPrice,
    gross: billingCopy.unlimitedGross,
    points: billingCopy.unlimitedPoints,
    icon: Crown,
    wash: "bg-white/15 text-white",
  },
];

const compareRows: { feature: string; values: Array<boolean | string> }[] = [
  { feature: billingCopy.compareBrowse, values: [true, true, true] },
  { feature: billingCopy.compareConnect, values: [false, true, true] },
  { feature: billingCopy.compareMatches, values: [billingCopy.compareNone, billingCopy.compareThree, billingCopy.compareUnlimited] },
  { feature: billingCopy.compareVat, values: ["—", "21%", "21%"] },
];

export function PremiumPlans({ plan, notice }: { plan: BuyerPlanName; notice: string | null }) {
  const [yearly, setYearly] = useState(false);
  const [portalState, portalAction, portalPending] = useActionState(openBillingPortalAction, null);
  const current =
    plan === "limited" ? billingCopy.currentLimited : plan === "unlimited" ? billingCopy.currentUnlimited : billingCopy.currentFree;

  return (
    <div className="flex flex-col gap-8">
      <section
        className="relative overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-10"
        style={{
          background:
            "radial-gradient(90% 120% at 0% 0%, #8ea2ff 0%, #465ab4 32%, #1c2740 70%)",
        }}
      >
        <p className="text-xs font-semibold tracking-[0.22em] text-white/70 uppercase">Releva</p>
        <h2 className="mt-3 max-w-xl text-5xl leading-none tracking-tight italic [font-family:var(--public-display)] sm:text-6xl">
          Mira gratis. Conecta cuando toque.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">{billingCopy.intro}</p>
        <p className="mt-5 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium">{current}</p>
      </section>
      {notice ? <p className="text-sm text-[#157a45]">{notice}</p> : null}
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-full bg-[#1c2740] p-1" role="group" aria-label={billingCopy.periodLabel}>
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={!yearly ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1c2740]" : "rounded-full px-4 py-2 text-sm text-white/70"}
          >
            {billingCopy.periodMonthly}
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={yearly ? "rounded-full bg-[#ffb703] px-4 py-2 text-sm font-semibold text-[#1c2740]" : "rounded-full px-4 py-2 text-sm text-white/70"}
          >
            {billingCopy.periodYearly}
          </button>
        </div>
        {yearly ? <p className="max-w-3xl text-sm leading-6 text-[#667085]">{billingCopy.yearlyNote}</p> : null}
      </div>
              <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:items-end">
        {plans.map((item) => {
          const active = plan === item.id;
          const featured = item.id === "unlimited";
          const Icon = item.icon;
          return (
            <section
              key={item.id}
              className={
                featured
                  ? "relative flex min-h-[28rem] flex-col overflow-hidden rounded-[2rem] bg-[#1c2740] p-6 text-white shadow-[0_28px_60px_-28px_rgba(28,39,64,0.8)] lg:-translate-y-3"
                  : active
                    ? "relative flex flex-col rounded-[2rem] border-2 border-[#17663a] bg-white p-6"
                    : "relative flex flex-col rounded-[2rem] border border-[#e7eaee] bg-white p-6"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.wash}`}>
                  <Icon className="size-6" aria-hidden />
                </span>
                {active ? (
                  <span className="rounded-full bg-[#e8f6ee] px-3 py-1 text-xs font-semibold text-[#17663a]">{billingCopy.yourPlan}</span>
                ) : featured ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{billingCopy.recommended}</span>
                ) : null}
              </div>
              <h2 className={featured ? "mt-5 text-lg font-semibold" : "mt-5 text-lg font-semibold text-[#1c2740]"}>{item.name}</h2>
              <p className={featured ? "mt-3 text-5xl leading-none tracking-tight italic [font-family:var(--public-display)]" : "mt-3 text-5xl leading-none tracking-tight text-[#1c2740] italic [font-family:var(--public-display)]"}>
                {yearly && item.id === "limited"
                  ? billingCopy.limitedYearly
                  : yearly && item.id === "unlimited"
                    ? billingCopy.unlimitedYearly
                    : item.price}
              </p>
              <p className={featured ? "mt-2 text-sm text-white/80" : "mt-2 text-sm text-[#667085]"}>
                {item.gross === null
                  ? billingCopy.freeBody
                  : yearly && item.id === "limited"
                    ? billingCopy.limitedYearlyGross
                    : yearly && item.id === "unlimited"
                      ? billingCopy.unlimitedYearlyGross
                      : item.gross}
              </p>
              {item.gross ? <p className={featured ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-[#8b95a7]"}>{billingCopy.vatNote}</p> : null}
              <ul className="mt-6 flex flex-col gap-3">
                {item.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm">
                    <Check className={featured ? "size-4 shrink-0 text-white" : "size-4 shrink-0 text-[#17663a]"} aria-hidden />
                    <span className={featured ? "text-white" : "text-[#3d4a63]"}>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {item.id === "limited" && plan === "none" ? <PlanButton plan="limited" label={billingCopy.chooseLimited} /> : null}
                {item.id === "unlimited" && plan === "none" ? (
                  <PlanButton plan="unlimited" label={billingCopy.chooseUnlimited} featured />
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      <section className="overflow-x-auto rounded-3xl border border-[#e7eaee] bg-white" aria-labelledby="comparar-planes">
        <h2 id="comparar-planes" className="px-5 pt-5 text-lg font-semibold text-[#1c2740]">
          {billingCopy.compareTitle}
        </h2>
        <table className="mt-3 w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left font-medium text-[#667085]">{billingCopy.compareFeature}</th>
              {plans.map((item) => (
                <th
                  key={item.id}
                  className={item.id === "unlimited" ? "bg-[#eef2ff] px-4 py-3 text-left font-semibold text-[#465ab4]" : "px-4 py-3 text-left font-semibold text-[#1c2740]"}
                >
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.feature} className="border-t border-[#eef0f3]">
                <th scope="row" className="px-5 py-3 text-left font-medium text-[#1c2740]">
                  {row.feature}
                </th>
                {row.values.map((value, index) => (
                  <td key={`${row.feature}-${plans[index]?.id ?? index}`} className={plans[index]?.id === "unlimited" ? "bg-[#eef2ff] px-4 py-3" : "px-4 py-3"}>
                    {value === true ? (
                      <span className="inline-flex items-center gap-1.5 text-[#17663a]">
                        <Check className="size-4" aria-hidden />
                        {billingCopy.compareIncluded}
                      </span>
                    ) : value === false ? (
                      <span className="text-[#8b95a7]">{billingCopy.compareMissing}</span>
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="max-w-3xl rounded-2xl bg-[#f7f8fb] px-4 py-3 text-sm leading-6 text-[#667085]">{billingCopy.successNote}</p>
      {plan !== "none" ? (
        <form action={portalAction} className="flex flex-col items-start gap-2">
          <button
            type="submit"
            disabled={portalPending}
            className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-4 text-sm font-medium"
          >
            {billingCopy.manage}
          </button>
          <Note state={portalState} />
        </form>
      ) : null}
    </div>
  );
}
