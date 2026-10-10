"use client";

import { useActionState, useSyncExternalStore } from "react";
import {
  approveProjectAction,
  changeRoleAction,
  grantPlanAction,
  reactivateAccountAction,
  suspendAccountAction,
  unpublishProjectAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { AppToast } from "@/components/app-toast";
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
    <p className="text-sm text-red-700" role="alert">
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
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" disabled={pending} className={quietButtonClass}>
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
  const fieldId = `role-${userId}`;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-xs text-[#667085]">
          {adminCopy.roleLabel}
        </label>
        <select id={fieldId} name="role" defaultValue={current} className="h-9 rounded-xl border border-[#e7eaee] bg-white px-2 text-sm text-[#1c2740]">
          {userRoles.map((item) => (
            <option key={item} value={item}>
              {adminCopy.accountRoles[item]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? adminCopy.changingRole : adminCopy.changeRole}
      </button>
      <ErrorNote state={state} />
    </form>
  );
}

export function PlanForm({ userId }: { userId: string }) {
  const { state, formAction, pending } = useAccountAction(grantPlanAction);
  const fieldId = `plan-${userId}`;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-xs text-[#667085]">
          {adminCopy.grantPlan}
        </label>
        <select id={fieldId} name="plan" defaultValue="limited" className="h-9 rounded-xl border border-[#e7eaee] bg-white px-2 text-sm text-[#1c2740]">
          <option value="limited">{adminCopy.plans.limited}</option>
          <option value="unlimited">{adminCopy.plans.unlimited}</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? adminCopy.grantingPlan : adminCopy.grantPlan}
      </button>
      <ErrorNote state={state} />
    </form>
  );
}

function isAccountRole(role: string | null): role is UserRoleName {
  return role === "seller" || role === "investor" || role === "advisor" || role === "admin";
}
