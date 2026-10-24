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
    <ul className="mt-2 flex flex-col gap-1.5">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2 text-sm text-[#3d4a63]">
          <Check className="mt-0.5 size-4 shrink-0 text-[#17663a]" aria-hidden />
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
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-[#1c2740]">{billingCopy.onboardingPlanTitle}</p>
        <p className="mt-1 text-sm text-[#5c6b78]">{billingCopy.onboardingPlanBody}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={billingCopy.onboardingPlanTitle}>
        {buyerPlans.map((plan) => {
          const selected = value === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(plan.id);
              }}
              className={
                selected
                  ? "flex cursor-pointer flex-col rounded-2xl border-2 border-[#465ab4] bg-[#eef2ff] p-4 text-left"
                  : "flex cursor-pointer flex-col rounded-2xl border border-[#e1e6ee] bg-white p-4 text-left transition-colors hover:border-[#465ab4]"
              }
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-[#1c2740]">{plan.name}</span>
                {selected ? (
                  <span className="rounded-full bg-[#465ab4] px-2 py-0.5 text-xs font-semibold text-white">
                    {billingCopy.onboardingPlanPicked}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 text-2xl font-semibold text-[#1c2740]">
                {plan.price}
                {plan.id === "none" ? null : (
                  <span className="text-xs font-normal text-[#667085]"> {billingCopy.onboardingPlanMonthly}</span>
                )}
              </span>
              {plan.inherit ? <span className="mt-3 text-sm font-medium text-[#465ab4]">{plan.inherit}</span> : null}
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
