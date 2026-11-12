"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resumePlanAction, type OnboardingState } from "@/app/onboarding/actions";
import { BuyerPlanStep, type OnboardingPlanChoice } from "@/components/auth/onboarding-plan-step";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { billingCopy } from "@/lib/billing-copy";
import { authCopy } from "@/lib/auth-copy";

/** The Plan step on its own, shown when a buyer comes back from Stripe without paying. */
export function OnboardingPlanResume({ home }: { home: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(resumePlanAction, null);
  const [plan, setPlan] = useState<OnboardingPlanChoice>("none");

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="plan" value={plan} />
      <BuyerPlanStep value={plan} onChange={setPlan} />
      {state?.message ? (
        <p role="alert" className="text-sm text-[#c0362c]">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-3 border-t border-[#e6e9f0] pt-4">
        {plan === "none" ? (
          <Link
            href={home}
            className="inline-flex h-11 items-center rounded-xl bg-[#3d4a8a] px-5 text-sm font-medium text-white hover:bg-[#32407a]"
          >
            {billingCopy.onboardingPlanFinishFree}
          </Link>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-xl bg-[#3d4a8a] px-5 text-sm font-medium text-white hover:bg-[#32407a] disabled:opacity-60"
          >
            {pending ? authCopy.onboardingPending : billingCopy.onboardingPlanFinishPaid}
          </button>
        )}
      </div>
      {plan !== "none" ? <CheckoutLegalNote /> : null}
    </form>
  );
}
