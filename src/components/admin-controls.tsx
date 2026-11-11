"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw, UserX } from "lucide-react";
import {
  grantPlanAction,
  reactivateAccountAction,
  suspendAccountAction,
  toggleVerifiedAction,
  type AdminActionState,
} from "@/app/(app)/admin/actions";
import { AppToast } from "@/components/app-toast";
import { adminCopy } from "@/lib/admin-copy";

function Note({ state }: { state: AdminActionState }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-[#157a45]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

function ErrorNote({ state }: { state: AdminActionState }) {
  if (!state || state.ok) {
    return null;
  }

  return (
    <p className="basis-full text-sm text-red-700" role="alert">
      {state.message}
    </p>
  );
}

type AccountToast = { message: string; pulse: number };

let accountToast: AccountToast | null = null;
const toastListeners = new Set<() => void>();

function publishAccountToast(message: string) {
  accountToast = { message, pulse: Date.now() };

  for (const listener of toastListeners) {
    listener();
  }
}

function subscribeAccountToast(listener: () => void) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

function readAccountToast() {
  return accountToast;
}

function readServerAccountToast() {
  return null;
}

export function AccountToastHost() {
  const toast = useSyncExternalStore(subscribeAccountToast, readAccountToast, readServerAccountToast);

  return <AppToast message={toast?.message ?? null} pulse={toast?.pulse ?? 0} />;
}

function useAccountAction(actionFn: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>) {
  const [state, formAction, pending] = useActionState(async (previous: AdminActionState, formData: FormData) => {
    const result = await actionFn(previous, formData);

    if (result?.ok) {
      publishAccountToast(result.message);
    }

    return result;
  }, null);

  return { state, formAction, pending };
}

const quietButtonClass =
  "inline-flex h-9 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#1c2740] disabled:opacity-60";

const dangerButtonClass =
  "inline-flex h-8 items-center rounded-full bg-[#c0362c] px-3 text-xs font-semibold text-white hover:bg-[#a52d24] disabled:opacity-60";

/** Status chip on an admin company card. It does not publish or unpublish. */
export function StatusPillToggle({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`pointer-events-none rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-white/70 ${tone}`}>
      {label}
    </span>
  );
}

export function VerifiedToggle({
  target,
  id,
  verified,
  compact = false,
}: {
  target: "project" | "advisor";
  id: string;
  verified: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(toggleVerifiedAction, null);

  if (compact) {
    return (
      <form action={action} className="flex flex-col items-end gap-1">
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="verified" value={verified ? "0" : "1"} />
        <button
          type="submit"
          role="switch"
          aria-checked={verified}
          disabled={pending}
          title={verified ? adminCopy.unverify : adminCopy.verify}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe4ea] bg-white py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-[#3d4a63] hover:border-[#9fb0c4] disabled:opacity-60"
        >
          <span className={`relative h-4 w-7 rounded-full transition-colors ${verified ? "bg-[#0f8a7a]" : "bg-[#c5ced8]"}`}>
            <span className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-all ${verified ? "left-3.5" : "left-0.5"}`} />
          </span>
          {verified ? "Verificado" : "No verificado"}
        </button>
        <Note state={state} />
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="verified" value={verified ? "0" : "1"} />
      <button type="submit" disabled={pending} aria-pressed={verified} className={quietButtonClass}>
        {pending ? adminCopy.verifying : verified ? adminCopy.unverify : adminCopy.verify}
      </button>
      <Note state={state} />
    </form>
  );
}

/**
 * Quiet corner action on an account card: an icon that shows on card hover or keyboard focus
 * (always on touch screens), opening a small confirm before suspending or reactivating.
 * The parent card must be `relative group/account`.
 */
export function SuspensionButton({ userId, name, suspended }: { userId: string; name: string; suspended: boolean }) {
  const { state, formAction, pending } = useAccountAction(suspended ? reactivateAccountAction : suspendAccountAction);
  const [confirming, setConfirming] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = suspended ? adminCopy.reactivate : adminCopy.suspend;
  const Icon = suspended ? RotateCcw : UserX;

  useEffect(() => {
    if (!confirming) return;
    function onPointer(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setConfirming(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirming(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirming]);

  return (
    <div ref={root} className="absolute -top-3 -right-3 z-10 flex flex-col items-end">
      <button
        type="button"
        aria-label={`${label}: ${name}`}
        title={label}
        aria-expanded={confirming}
        onClick={() => setConfirming((value) => !value)}
        className={`inline-flex size-8 items-center justify-center rounded-full border bg-white shadow-sm transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2fc4b2] group-hover/account:opacity-100 group-focus-within/account:opacity-100 [@media(hover:none)]:opacity-100 ${
          confirming ? "opacity-100" : "opacity-0"
        } ${suspended ? "border-[#dfe4ea] text-[#0f6e6a] hover:bg-[#e6f4f3]" : "border-[#f1d4d1] text-[#c0362c] hover:bg-[#fdecec]"}`}
      >
        <Icon className="size-4" aria-hidden />
      </button>
      {confirming ? (
        <form
          action={(data) => {
            setConfirming(false);
            formAction(data);
          }}
          className="mt-1.5 w-60 rounded-xl border border-[#e7eaee] bg-white p-3 text-left shadow-lg"
        >
          <input type="hidden" name="userId" value={userId} />
          <p className="text-sm font-semibold text-[#1c2740]">{suspended ? adminCopy.reactivateConfirmTitle : adminCopy.suspendConfirmTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{suspended ? adminCopy.reactivateConfirmBody : adminCopy.suspendConfirmBody}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-[#3d4a63] hover:bg-[#eef1f5]">
              {adminCopy.cancel}
            </button>
            <button type="submit" disabled={pending} className={suspended ? quietButtonClass.replace("h-9", "h-8").replace("text-sm", "text-xs") : dangerButtonClass}>
              {pending ? (suspended ? adminCopy.reactivating : adminCopy.suspending) : suspended ? adminCopy.reactivate : adminCopy.suspendShort}
            </button>
          </div>
        </form>
      ) : null}
      <ErrorNote state={state} />
    </div>
  );
}

export function PlanPicker({ userId, plan }: { userId: string; plan: "none" | "limited" | "unlimited" }) {
  const { state, formAction, pending } = useAccountAction(grantPlanAction);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const options = ["none", "limited", "unlimited"] as const;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={root} className="relative inline-flex flex-col items-end">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={adminCopy.planChange}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[#1c2740] underline decoration-dotted underline-offset-2 hover:bg-[#eef1f5]"
      >
        {pending ? adminCopy.grantingPlan : adminCopy.plans[plan]}
        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      {open ? (
        <form
          action={(data) => {
            setOpen(false);
            formAction(data);
          }}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 flex min-w-40 flex-col rounded-xl border border-[#e7eaee] bg-white p-1 text-left shadow-lg"
        >
          <input type="hidden" name="userId" value={userId} />
          {options.map((option) => (
            <button
              key={option}
              type="submit"
              name="plan"
              value={option}
              role="menuitem"
              disabled={option === plan}
              className="rounded-lg px-3 py-2 text-left text-xs font-medium text-[#1c2740] hover:bg-[#eef1f5] disabled:text-[#98a2b3]"
            >
              {adminCopy.plans[option]}
              {option === plan ? ` · ${adminCopy.planCurrent}` : ""}
            </button>
          ))}
        </form>
      ) : null}
      <ErrorNote state={state} />
    </span>
  );
}
