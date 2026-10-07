"use client";

import { useActionState, type ChangeEvent } from "react";
import { acceptAdvisorNdaAction, closeEngagementAction } from "@/app/mandatos/encargos/actions";
import { engagementCopy } from "@/lib/engagement-copy";
import { keepUnsignedEuro } from "@/lib/numeric-input";

export function AdvisorNdaForm({ engagementId, text }: { engagementId: string; text: string }) {
  const [state, action, pending] = useActionState(acceptAdvisorNdaAction, null);

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.ndaTitle}</h2>
      <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.ndaInvestorNote}</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f7f8fb] p-4 text-sm leading-6 text-[#1c2740]">{text}</pre>
      <form action={action} className="mt-4 flex flex-col items-start gap-2">
        <input type="hidden" name="engagementId" value={engagementId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? engagementCopy.ndaPending : engagementCopy.ndaSign}
        </button>
        {state ? (
          <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export function AdvisorCloseForm({
  engagementId,
  closed,
  feeLabel,
}: {
  engagementId: string;
  closed: boolean;
  feeLabel: string | null;
}) {
  const [state, action, pending] = useActionState(closeEngagementAction, null);

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.closeJob}</h2>
      <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.closeJobHint}</p>
      {closed ? (
        <p className="mt-3 text-sm text-[#17663a]">
          {engagementCopy.feeStored}
          {feeLabel ? ` ${feeLabel}.` : ""}
        </p>
      ) : (
        <form action={action} className="mt-4 flex flex-col items-start gap-2">
          <label className="text-sm">
            {engagementCopy.chargedLabel}
            <input
              name="price"
              required
              inputMode="decimal"
              onChange={keepEuro}
              className="mt-1 h-11 rounded-xl border border-[#d0d5dd] px-3"
            />
          </label>
          <input type="hidden" name="engagementId" value={engagementId} />
          <button type="submit" disabled={pending} className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-4 text-sm">
            {pending ? "Guardando…" : engagementCopy.closeJob}
          </button>
          {state ? (
            <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
              {state.message}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

function keepEuro(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.value = keepUnsignedEuro(event.currentTarget.value);
}
