"use client";

import { Check } from "lucide-react";
import { billingCopy } from "@/lib/billing-copy";

export type OnboardingPlanChoice = "none" | "limited" | "unlimited";

const buyerPlans: {
  id: OnboardingPlanChoice;
  name: string;
  price: string;
  inherit: string | null;
  points: readonly string[];
  recommended?: boolean;
}[] = [
  {
    id: "none",
    name: billingCopy.freeName,
    price: "0 €",
    inherit: null,
    points: ["Ver el catálogo completo", "Fichas anónimas con las cifras", "Guardar empresas en favoritas"],
  },
  {
    id: "limited",
    name: billingCopy.limitedName,
    price: "20 €",
    inherit: billingCopy.limitedInherit,
    points: billingCopy.limitedPoints,
    recommended: true,
  },
  {
    id: "unlimited",
    name: billingCopy.unlimitedName,
    price: "99 €",
    inherit: billingCopy.unlimitedInherit,
    points: billingCopy.unlimitedPoints,
  },
];

function PointList({ points }: { points: readonly string[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2.5 text-[15px] leading-6 text-[#3d4a63]">
          <Check className="mt-1 size-4 shrink-0 text-[#17663a]" aria-hidden />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

export function BuyerPlanStep({
  value,
  onChange,
}: {
  value: OnboardingPlanChoice;
  onChange: (value: OnboardingPlanChoice) => void;
}) {
  return (
    <div data-wide className="flex flex-col gap-5">
      <div>
        <p className="text-base font-semibold text-[#1c2740]">{billingCopy.onboardingPlanTitle}</p>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{billingCopy.onboardingPlanBody}</p>
      </div>
      <div className="grid gap-4 pt-3 md:grid-cols-3 md:items-stretch md:gap-5" role="radiogroup" aria-label={billingCopy.onboardingPlanTitle}>
        {buyerPlans.map((plan) => {
          const selected = value === plan.id;
          const frame = plan.recommended
            ? "border-2 border-[#465ab4] shadow-[0_18px_40px_-20px_rgba(70,90,180,0.55)] md:-translate-y-2"
            : "border border-[#e1e6ee] hover:border-[#9aa8dc]";
          const fill = selected ? "bg-[#eef2ff] ring-2 ring-[#465ab4] ring-offset-2" : "bg-white";
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(plan.id);
              }}
              className={`relative flex cursor-pointer flex-col rounded-2xl p-6 text-left transition-[box-shadow,border-color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4] ${frame} ${fill}`}
            >
              {plan.recommended ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#465ab4] px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
                  {billingCopy.onboardingPlanRecommended}
                </span>
              ) : null}
              <span className="flex min-h-7 items-center justify-between gap-2">
                <span className="text-lg font-semibold text-[#1c2740]">{plan.name}</span>
                {selected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1c2740] px-2.5 py-1 text-xs font-semibold text-white">
                    <Check className="size-3.5" aria-hidden />
                    {billingCopy.onboardingPlanPicked}
                  </span>
                ) : null}
              </span>
              <span className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{plan.price}</span>
                {plan.id === "none" ? null : <span className="text-sm text-[#667085]">{billingCopy.onboardingPlanMonthly}</span>}
              </span>
              <span className="mt-5 border-t border-[#e7eaee] pt-4 text-sm font-semibold text-[#465ab4]">
                {plan.inherit ?? billingCopy.onboardingPlanFreeIncludes}
              </span>
              <PointList points={plan.points} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdvisorPlanStep() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-[#1c2740]">{billingCopy.advisorPlanTitle}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-[#e1e6ee] bg-white p-4">
          <span className="text-base font-semibold text-[#1c2740]">{billingCopy.advisorPlanFreeName}</span>
          <span className="mt-2 text-2xl font-semibold text-[#1c2740]">0 €</span>
          <PointList points={billingCopy.advisorPlanFreePoints} />
        </div>
        <div className="flex flex-col rounded-2xl border-2 border-[#465ab4] bg-[#eef2ff] p-4">
          <span className="text-base font-semibold text-[#1c2740]">{billingCopy.advisorPlanPaidName}</span>
          <span className="mt-2 text-2xl font-semibold text-[#1c2740]">
            {billingCopy.advisorPlanPaidPrice}
            <span className="text-xs font-normal text-[#667085]"> {billingCopy.onboardingPlanMonthly}</span>
          </span>
          <span className="mt-3 text-sm font-medium text-[#465ab4]">{billingCopy.advisorPlanPaidInherit}</span>
          <PointList points={billingCopy.advisorPlanPaidPoints} />
        </div>
      </div>
    </div>
  );
}
