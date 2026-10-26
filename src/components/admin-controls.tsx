"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  approveProjectAction,
  changeRoleAction,
  grantPlanAction,
  reactivateAccountAction,
  suspendAccountAction,
  toggleVerifiedAction,
  unpublishProjectAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { AppToast } from "@/components/app-toast";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { userRoles, type UserRoleName } from "@/lib/auth-input";

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

const buttonClass =
  "inline-flex h-9 items-center rounded-full bg-[#465ab4] px-3 text-sm font-medium text-white disabled:opacity-60";
const quietButtonClass =
  "inline-flex h-9 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#1c2740] disabled:opacity-60";

const dangerButtonClass =
  "inline-flex h-8 items-center rounded-full bg-[#c0362c] px-3 text-xs font-semibold text-white hover:bg-[#a52d24] disabled:opacity-60";

export function UnpublishButton({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(unpublishProjectAction, null);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" disabled={pending} className={quietButtonClass}>
        {pending ? adminCopy.unpublishing : adminCopy.unpublish}
      </button>
      <Note state={state} />
    </form>
  );
}

export function VerifiedToggle({ target, id, verified }: { target: "project" | "advisor"; id: string; verified: boolean }) {
  const [state, action, pending] = useActionState(toggleVerifiedAction, null);

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

export function ApproveButton({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(approveProjectAction, null);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? adminCopy.approving : adminCopy.approve}
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

export function RoleForm({ userId, role }: { userId: string; role: string | null }) {
  const { state, formAction, pending } = useAccountAction(changeRoleAction);
  const current = isAccountRole(role) ? role : "seller";
  const [nextRole, setNextRole] = useState<string>(current);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNextRole(current);
          dialogRef.current?.showModal();
        }}
        className="inline-flex h-8 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-xs font-medium text-[#3d4a63] hover:bg-[#f6f7f9]"
      >
        {adminCopy.changeRoleOpen}
      </button>
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-0 bg-white p-6 text-[#1c2740] open:block backdrop:bg-[#1c2740]/40"
      >
        <h2 className="text-lg font-semibold">{adminCopy.changeRoleTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{adminCopy.changeRoleBody}</p>
        <form action={formAction} className="mt-4 grid gap-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="role" value={nextRole} />
          <FilterSelect
            compact
            label={adminCopy.roleLabel}
            value={nextRole}
            options={userRoles.map((item) => ({ value: item, label: adminCopy.accountRoles[item] }))}
            onValueChange={setNextRole}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.close();
              }}
              className={quietButtonClass}
            >
              {adminCopy.changeRoleCancel}
            </button>
            <button type="submit" disabled={pending || nextRole === current} className={buttonClass}>
              {pending ? adminCopy.changingRole : adminCopy.changeRoleConfirm}
            </button>
          </div>
          <ErrorNote state={state} />
        </form>
      </dialog>
    </>
  );
}

export function PlanForm({ userId }: { userId: string }) {
  const { state, formAction, pending } = useAccountAction(grantPlanAction);
  const [plan, setPlan] = useState("limited");

  return (
    <form action={formAction} className="flex w-full flex-col items-stretch gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="plan" value={plan} />
      <FilterSelect
        compact
        label={adminCopy.grantPlan}
        value={plan}
        options={[
          { value: "limited", label: adminCopy.plans.limited },
          { value: "unlimited", label: adminCopy.plans.unlimited },
        ]}
        onValueChange={setPlan}
      />
      <button type="submit" disabled={pending} className={`${buttonClass} self-end`}>
        {pending ? adminCopy.grantingPlan : adminCopy.grantPlan}
      </button>
      <ErrorNote state={state} />
    </form>
  );
}

function isAccountRole(role: string | null): role is UserRoleName {
  return role === "seller" || role === "investor" || role === "advisor" || role === "admin";
}
