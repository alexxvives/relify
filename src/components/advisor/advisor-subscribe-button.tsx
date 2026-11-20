"use client";

import { useActionState } from "react";
import { startInboxCheckoutAction } from "@/app/(app)/mandatos/encargos/actions";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { Button } from "@/components/ui/form";
import { advisorCopy } from "@/lib/advisor-copy";

/** S35 (Alex): the subscription is a mandatory Inicio step; paying it (Stripe Checkout) is what lets the profile go live. */
export function AdvisorSubscribeButton() {
  const [state, action, pending] = useActionState(startInboxCheckoutAction, null);

  return (
    <div id="suscripcion" className="mt-3 rounded-xl border border-[#d9e2f2] bg-[#f5f7ff] p-3">
      <p className="text-sm leading-6 text-[#475569]">{advisorCopy.subscribeNote}</p>
      <form action={action} className="mt-3">
        <input type="hidden" name="returnTo" value="/mandatos" />
        <Button type="submit" disabled={pending} className="w-full rounded-full text-sm">
          {pending ? advisorCopy.subscribing : advisorCopy.subscribe}
        </Button>
      </form>
      <div className="mt-2">
        <CheckoutLegalNote />
      </div>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
