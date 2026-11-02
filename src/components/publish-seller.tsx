"use client";

import { useActionState } from "react";
import { publishSellerProjectAction } from "@/app/(app)/mi-empresa/actions";
import { billingCopy } from "@/lib/billing-copy";

export function PublishSellerButton({
  requiresPayment = false,
  ready = true,
}: {
  requiresPayment?: boolean;
  /** t74: every required checklist item is done. */
  ready?: boolean;
}) {
  const [state, action, pending] = useActionState(publishSellerProjectAction, null);

  return (
    <form action={action} className="mt-4 flex flex-col items-start gap-2">
      <p className="text-sm text-[#475467]">{billingCopy.publishExplainer}</p>
      {requiresPayment ? <p className="text-sm text-[#667085]">{billingCopy.listingNote}</p> : null}
      <button
        type="submit"
        disabled={pending || !ready}
        className="inline-flex h-10 items-center rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#0c5f59] disabled:cursor-not-allowed disabled:bg-[#c5cdd6] disabled:text-white"
      >
        {pending ? billingCopy.publishing : requiresPayment ? billingCopy.publishPaid : billingCopy.sellerPublish}
      </button>
      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-[#157a45]">{billingCopy.reviewRequested}</p> : null}
    </form>
  );
}
