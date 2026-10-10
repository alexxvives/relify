"use client";

import { useState } from "react";
import { AccountToastHost, PlanForm, RoleForm, SuspensionButton } from "@/components/admin-controls";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminAccountRow } from "@/server/listAdminAccounts";

const fieldClass =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] bg-white px-3 text-base text-[#1c2740] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20";

function accountRoleLabel(role: string | null): string {
  if (role === "seller" || role === "investor" || role === "advisor" || role === "admin") {
    return adminCopy.accountRoles[role];
  }

  return adminCopy.roles.none;
}

export function AdminAccounts({ accounts, viewerId }: { accounts: AdminAccountRow[]; viewerId: string }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = accounts.filter((account) => {
    if (needle.length === 0) {
      return true;
    }

    return `${account.name} ${account.email}`.toLocaleLowerCase("es").includes(needle);
  });

  return (
    <div className="flex flex-col gap-4">
      <AccountToastHost />
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <label htmlFor="admin-account-search" className="flex flex-col gap-1.5 text-xs font-medium text-[#667085]">
          {adminCopy.searchLabel}
          <input
            id="admin-account-search"
            type="search"
            value={query}
            placeholder={adminCopy.searchAccounts}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className={fieldClass}
          />
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((account) => {
            const self = account.id === viewerId;

            return (
              <li key={account.id} className="rounded-2xl border border-[#e7eaee] bg-white px-4 py-4">
                <p className="text-base font-semibold text-[#1c2740]">{account.name}</p>
                <p className="mt-1 text-sm text-[#667085]">
                  {account.email} · {accountRoleLabel(account.role)}
                </p>
                <p className="mt-1 text-xs text-[#8b95a7]">
                  {account.onboarded ? adminCopy.onboarded : adminCopy.pendingOnboarding}
                  {account.suspended ? ` · ${adminCopy.suspendedBadge}` : ""}
                  {account.role === "investor" ? ` · ${adminCopy.planCurrent}: ${adminCopy.plans[account.plan]}` : ""}
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {self ? (
                    <p className="text-sm text-[#667085]">{adminCopy.ownSuspend}</p>
                  ) : (
                    <SuspensionButton userId={account.id} suspended={account.suspended} />
                  )}
                  {self ? <p className="text-sm text-[#667085]">{adminCopy.ownRole}</p> : <RoleForm userId={account.id} role={account.role} />}
                  {account.role === "investor" ? <PlanForm userId={account.id} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
