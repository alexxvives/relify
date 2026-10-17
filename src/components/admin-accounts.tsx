"use client";

import { useState } from "react";
import { AccountToastHost, PlanForm, RoleForm, SuspensionButton } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminAccountRow } from "@/server/listAdminAccounts";

type RoleFilter = "all" | "seller" | "investor" | "advisor" | "admin" | "none";
type StateFilter = "all" | "active" | "suspended" | "pending";

function isRoleFilter(value: string): value is RoleFilter {
  return value === "all" || value === "seller" || value === "investor" || value === "advisor" || value === "admin" || value === "none";
}

function isStateFilter(value: string): value is StateFilter {
  return value === "all" || value === "active" || value === "suspended" || value === "pending";
}

function accountRoleLabel(role: string | null): string {
  if (role === "seller" || role === "investor" || role === "advisor" || role === "admin") {
    return adminCopy.accountRoles[role];
  }

  return adminCopy.roles.none;
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
    if (role === "none" && account.role !== null) {
      return false;
    }

    if (role !== "all" && role !== "none" && account.role !== role) {
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
              { value: "admin", label: adminCopy.accountRoles.admin },
              { value: "none", label: adminCopy.roles.none },
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
        <ul className="grid gap-3">
          {visible.map((account) => (
            <li key={account.id}>
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
    <article className="grid items-start gap-4 rounded-2xl border border-[#e7eaee] bg-white p-5 sm:grid-cols-2">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-sm font-semibold text-white">
          {initialOf(account.name)}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#1c2740]">{account.name}</p>
          <p className="mt-0.5 break-all text-sm text-[#667085]">{account.email}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            <li className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-medium text-[#163a8a]">{accountRoleLabel(account.role)}</li>
            <li
              className={
                account.onboarded
                  ? "rounded-full bg-[#e8f6ee] px-2.5 py-1 text-xs font-medium text-[#17663a]"
                  : "rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-medium text-[#8a6112]"
              }
            >
              {account.onboarded ? adminCopy.onboarded : adminCopy.pendingOnboarding}
            </li>
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
        <p className="text-sm text-[#667085] sm:text-right">
          {adminCopy.ownSuspend} {adminCopy.ownRole}
        </p>
      ) : (
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SuspensionButton userId={account.id} suspended={account.suspended} />
            <RoleForm userId={account.id} role={account.role} />
          </div>
          {account.role === "investor" ? <PlanForm userId={account.id} /> : null}
        </div>
      )}
    </article>
  );
}
