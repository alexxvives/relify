"use client";

import { useActionState } from "react";
import { publishSellerProjectAction } from "@/app/(app)/mi-empresa/actions";
import { CheckoutLegalNote } from "@/components/auth/checkout-legal-note";
import { billingCopy } from "@/lib/billing-copy";

/**
 * t75: the only seller publishing control left. Shown only when the checklist is complete and the
 * listing still needs payment (2nd and later companies). The first company submits itself.
 */
export function PublishPayButton({ blocked = null }: { blocked?: string | null }) {
  const [state, action, pending] = useActionState(publishSellerProjectAction, null);

  return (
    <form action={action} className="mt-4 flex flex-col items-start gap-2">
      <p className="text-sm text-[#475467]">{blocked ?? billingCopy.listingNote}</p>
      {blocked === null ? <CheckoutLegalNote /> : null}
      <button
        type="submit"
        disabled={pending || blocked !== null}
        className="inline-flex h-10 items-center rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#0c5f59] disabled:cursor-not-allowed disabled:bg-[#c5cdd6] disabled:text-white"
      >
        {pending ? billingCopy.publishing : billingCopy.publishPaid}
      </button>
      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
