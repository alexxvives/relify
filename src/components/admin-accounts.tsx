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

const joined = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });

function accountState(account: AdminAccountRow): { label: string; tone: string } {
  if (account.suspended) return { label: "Suspendida", tone: "bg-[#fdeeee] text-[#8d2424]" };
  if (!account.onboarded) return { label: adminCopy.accountStatePending, tone: "bg-[#fff4d6] text-[#8a6112]" };
  return { label: "Activa", tone: "bg-[#e7f6ef] text-[#1f6b4a]" };
}

function roleLabel(role: string | null): string {
  if (role && role in adminCopy.accountRoles) return adminCopy.accountRoles[role as keyof typeof adminCopy.accountRoles];
  return "Sin rol";
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-1.5 text-xs">
      <dt className="shrink-0 text-[#667085]">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-[#1c2740]">{children}</dd>
    </div>
  );
}

function AccountCard({ account, self }: { account: AdminAccountRow; self: boolean }) {
  const state = accountState(account);
  return (
    <article className={`flex w-full flex-col rounded-2xl border p-4 ${account.isNew ? adminNewRing : "border-[#e7eaee] bg-white"}`}>
      <header className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-sm font-semibold text-white">
          {initialOf(account.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#1c2740]">
            <span className="truncate" title={account.name}>{account.name}</span>
            {account.isNew ? <NewPill /> : null}
          </p>
          <p className="truncate text-xs text-[#667085]" title={account.email}>{account.email}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${state.tone}`}>{state.label}</span>
      </header>
      <dl className="mt-3 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
        <InfoRow label="Rol">{roleLabel(account.role)}</InfoRow>
        {account.role === "investor" ? <InfoRow label="Plan">{adminCopy.plans[account.plan]}</InfoRow> : null}
        <InfoRow label="Teléfono">{account.phone ?? "—"}</InfoRow>
        <InfoRow label="Alta">{joined.format(new Date(account.createdAt))}</InfoRow>
        <InfoRow label={adminCopy.referralSourceLabel}>{account.onboarded ? (account.referralSource ?? adminCopy.referralSourceEmpty) : "—"}</InfoRow>
      </dl>
      {self ? (
        <p className="mt-auto pt-3 text-xs text-[#667085]">
          {adminCopy.ownSuspend} {adminCopy.ownRole}
        </p>
      ) : (
        <div className="mt-auto flex flex-col items-stretch gap-2 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <RoleForm userId={account.id} role={account.role} />
            <SuspensionButton userId={account.id} suspended={account.suspended} />
          </div>
          {account.role === "investor" ? <PlanForm userId={account.id} /> : null}
        </div>
      )}
    </article>
  );
}
