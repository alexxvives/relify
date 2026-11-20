"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { startInboxCheckoutAction } from "@/app/(app)/mandatos/encargos/actions";
import { advisorCopy } from "@/lib/advisor-copy";

/** S37 (Alex): the subscription is just its Inicio checklist row; clicking it opens Stripe Checkout. */
export function AdvisorSubscribeRow({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(startInboxCheckoutAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="returnTo" value="/mandatos" />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        data-advisor-subscribe
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none focus-visible:ring-inset disabled:opacity-70"
      >
        {children}
      </button>
      {pending ? <p className="sr-only" role="status">{advisorCopy.subscribing}</p> : null}
      {state && !state.ok ? (
        <p role="alert" className="px-3 pb-2.5 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
