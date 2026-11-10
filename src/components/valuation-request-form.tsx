"use client";

import { useActionState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { requestValuationAction, type ValuationState } from "@/app/valorar/actions";
import { valuationCopy } from "@/lib/valuation-request";

const emptySubscribe = () => () => undefined;
const useHydrated = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

const initial: ValuationState = { status: "idle" };

const fieldClass =
  "h-12 rounded-full border border-public-line bg-white px-4 text-base outline-none focus-visible:border-public-ink aria-[invalid=true]:border-red-600";

export type ValuationAccount = {
  name: string;
  email: string;
  phone: string | null;
};

export function ValuationRequestForm({ account }: { account: ValuationAccount | null }) {
  const hydrated = useHydrated();
  const [state, action, pending] = useActionState(requestValuationAction, initial);
  const busy = hydrated && pending;

  if (state.status === "ok") {
    return (
      <div
        className="mt-8 max-w-xl rounded-3xl border border-[#d7ebe8] bg-[#f3faf8] p-6 sm:p-8"
        role="status"
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e6f4f2] text-[#0f6b62]">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-public-ink">{valuationCopy.doneTitle}</h2>
        <p className="mt-2 text-base leading-7 text-public-muted">{valuationCopy.doneBody}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 max-w-xl" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
          {valuationCopy.cif}
          <input
            name="cif"
            required
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={12}
            placeholder={valuationCopy.cifPlaceholder}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {valuationCopy.name}
          <input
            name="contactName"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            defaultValue={account?.name ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {valuationCopy.email}
          <input
            name="contactEmail"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            defaultValue={account?.email ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
          <span>
            {valuationCopy.phone}{" "}
            <span className="font-normal text-public-muted">({valuationCopy.phoneHint})</span>
          </span>
          <input
            name="phone"
            type="tel"
            maxLength={32}
            autoComplete="tel"
            defaultValue={account?.phone ?? ""}
            className={fieldClass}
          />
        </label>
      </div>
      {account ? (
        <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-public-ink">
          <input
            type="checkbox"
            name="linkAccount"
            defaultChecked
            className="mt-1 size-4 shrink-0 rounded border-public-line accent-[#0f6b62]"
          />
          <span>{valuationCopy.linkAccount}</span>
        </label>
      ) : null}
      {state.status === "error" ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-public-muted">{valuationCopy.privacy}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-public-ink px-6 text-white disabled:opacity-60 sm:w-auto"
      >
        {busy ? valuationCopy.pending : valuationCopy.submit}
        {busy ? null : <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
