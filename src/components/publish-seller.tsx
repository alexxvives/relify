"use client";

import { useActionState } from "react";
import { publishSellerProjectAction } from "@/app/mi-empresa/actions";
import { billingCopy } from "@/lib/billing-copy";

export function PublishSellerButton() {
  const [state, action, pending] = useActionState(publishSellerProjectAction, null);

  return (
    <form action={action} className="mt-4 flex flex-col items-start gap-2">
      <p className="text-sm text-[#667085]">{billingCopy.sellerDraft}</p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? billingCopy.publishing : billingCopy.sellerPublish}
      </button>
      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-[#157a45]">{billingCopy.published}</p> : null}
    </form>
  );
}
