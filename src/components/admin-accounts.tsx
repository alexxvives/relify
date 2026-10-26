"use client";

import { useState } from "react";
import { AccountToastHost, PlanForm, RoleForm, SuspensionButton } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { NewPill, adminNewRing } from "@/components/admin-new";
import type { AdminAccountRow } from "@/server/listAdminAccounts";

type RoleFilter = "all" | "seller" | "investor" | "advisor";
type StateFilter = "all" | "active" | "suspended" | "pending";

function isRoleFilter(value: string): value is RoleFilter {
  return value === "all" || value === "seller" || value === "investor" || value === "advisor";
}

function isStateFilter(value: string): value is StateFilter {
  return value === "all" || value === "active" || value === "suspended" || value === "pending";
}

function initialOf(name: string): string {
  const letter = name.trim().charAt(0);
  return letter.length > 0 ? letter.toLocaleUpperCase("es-ES") : "?";
}

export function AdminAccounts({ accounts, viewerId }: { accounts: AdminAccountRow[]; viewerId: string }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = accounts.filter((account) => {
    if (role !== "all" && account.role !== role) {
      return false;
    }

    if (state === "suspended" && !account.suspended) {
      return false;
    }

    if (state === "pending" && account.onboarded) {
      return false;
    }

    if (state === "active" && (account.suspended || !account.onboarded)) {
      return false;
    }

    if (needle.length === 0) {
      return true;
    }

    return `${account.name} ${account.email}`.toLocaleLowerCase("es").includes(needle);
  });

  return (
    <div>
      <AccountToastHost />
      <AdminPageHeader title={adminCopy.accountsTitle}>
        <AdminSearchField
          id="admin-account-search"
          label={adminCopy.searchLabel}
          value={query}
          placeholder={adminCopy.searchAccounts}
          onChange={setQuery}
        />
        <div className="w-40">
          <FilterSelect
            compact
            label={adminCopy.roleLabel}
            value={role}
            options={[
              { value: "all", label: adminCopy.roleAll },
              { value: "seller", label: adminCopy.accountRoles.seller },
              { value: "investor", label: adminCopy.accountRoles.investor },
              { value: "advisor", label: adminCopy.accountRoles.advisor },
            ]}
            onValueChange={(next) => {
              if (isRoleFilter(next)) {
                setRole(next);
              }
            }}
          />
        </div>
        <div className="w-40">
          <FilterSelect
            compact
            label={adminCopy.accountStateLabel}
            value={state}
            options={[
              { value: "all", label: adminCopy.accountStateAll },
              { value: "active", label: adminCopy.accountStateActive },
              { value: "suspended", label: adminCopy.accountStateSuspended },
              { value: "pending", label: adminCopy.accountStatePending },
            ]}
            onValueChange={(next) => {
              if (isStateFilter(next)) {
                setState(next);
              }
            }}
          />
        </div>
      </AdminPageHeader>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((account) => (
            <li key={account.id} className="flex">
              <AccountCard account={account} self={account.id === viewerId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountCard({ account, self }: { account: AdminAccountRow; self: boolean }) {
  return (
    <article className={`flex w-full flex-col gap-3 rounded-2xl border p-4 ${account.isNew ? adminNewRing : "border-[#e7eaee] bg-white"}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-sm font-semibold text-white">
          {initialOf(account.name)}
        </span>
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#1c2740]">
            <span className="truncate">{account.name}</span>
            {account.isNew ? <NewPill /> : null}
          </p>
          <p className="truncate text-xs text-[#667085]" title={account.email}>{account.email}</p>
          {account.onboarded ? (
            <p className="mt-1 text-xs text-[#667085]">
              {adminCopy.referralSourceLabel}:{" "}
              <span className="font-medium text-[#3d4a63]">
                {account.referralSource ?? adminCopy.referralSourceEmpty}
              </span>
            </p>
          ) : null}
          <ul className="mt-2 flex flex-wrap gap-1.5 empty:hidden">
            {account.suspended ? (
              <li className="rounded-full bg-[#fdeeee] px-2.5 py-1 text-xs font-medium text-[#8d2424]">{adminCopy.suspendedBadge}</li>
            ) : null}
            {account.role === "investor" ? (
              <li className="rounded-full bg-[#fff4e8] px-2.5 py-1 text-xs font-medium text-[#9a4a08]">
                {adminCopy.plans[account.plan]}
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      {self ? (
        <p className="mt-auto text-xs text-[#667085]">
          {adminCopy.ownSuspend} {adminCopy.ownRole}
        </p>
      ) : (
        <div className="mt-auto flex flex-col items-stretch gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SuspensionButton userId={account.id} suspended={account.suspended} />
            <RoleForm userId={account.id} role={account.role} />
          </div>
          {account.role === "investor" ? <PlanForm userId={account.id} /> : null}
        </div>
      )}
    </article>
  );
}
