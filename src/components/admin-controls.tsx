"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import {
  approveProjectAction,
  grantPlanAction,
  reactivateAccountAction,
  suspendAccountAction,
  toggleVerifiedAction,
  unpublishProjectAction,
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

/** The status pill on an admin company card: Publicada unpublishes, Pendiente publishes, each after a confirm. */
export function StatusPillToggle({
  projectId,
  status,
  label,
  tone,
}: {
  projectId: string;
  status: "published" | "pending" | "draft";
  label: string;
  tone: string;
}) {
  const [state, action, pending] = useActionState(status === "published" ? unpublishProjectAction : approveProjectAction, null);
  const pill = `rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-white/70 ${tone}`;

  if (status === "draft") {
    return <span className={`pointer-events-none ${pill}`}>{label}</span>;
  }

  const question = status === "published" ? adminCopy.unpublishConfirm : adminCopy.publishConfirm;
  const hint = status === "published" ? adminCopy.unpublish : adminCopy.approve;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" disabled={pending} title={hint} aria-label={`${label}: ${hint}`} className={`${pill} cursor-pointer hover:brightness-95 disabled:opacity-60`}>
        {pending ? (status === "published" ? adminCopy.unpublishing : adminCopy.approving) : label}
      </button>
      <span className="rounded bg-white/90 px-1"><Note state={state} /></span>
    </form>
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

export function SuspensionButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const { state, formAction, pending } = useAccountAction(suspended ? reactivateAccountAction : suspendAccountAction);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" disabled={pending} className={suspended ? quietButtonClass : dangerButtonClass}>
        {pending
          ? suspended
            ? adminCopy.reactivating
            : adminCopy.suspending
          : suspended
            ? adminCopy.reactivate
            : adminCopy.suspend}
      </button>
      <ErrorNote state={state} />
    </form>
  );
}

export function PlanPicker({ userId, plan }: { userId: string; plan: "none" | "limited" | "unlimited" }) {
  const { state, formAction, pending } = useAccountAction(grantPlanAction);
  const [open, setOpen] = useState(false);
  const options = ["limited", "unlimited"] as const;

  return (
    <span className="relative inline-flex flex-col items-end">
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
