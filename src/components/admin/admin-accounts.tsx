"use client";

import { useState } from "react";
import { Briefcase, Building2, Handshake, ListChecks } from "lucide-react";
import { AccountToastHost, PlanPicker, SuspensionButton } from "@/components/admin/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin/admin-toolbar";
import { ChipRow, FilterChip } from "@/components/ui/chip-row";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminAccountSummary } from "@/lib/admin-account-summary";
import { adminCopy } from "@/lib/admin-copy";
import { NewPill } from "@/components/admin/admin-new";
import type { AdminAccountRow } from "@/lib/server/list-admin-accounts";

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
  const summary = adminAccountSummary(accounts);
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
        <div className="hidden w-40 lg:block">
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
        <div className="hidden w-40 lg:block">
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
      <ul className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { key: "total", label: adminCopy.totalLabel, value: summary.total, chip: "bg-[#1c2740]", ink: "text-[#1c2740]", bg: "bg-[#f4f6fb]", ring: "ring-[#1c2740]/10", icon: ListChecks },
          { key: "seller", label: adminCopy.accountRoles.seller, value: summary.seller, chip: "bg-[#0c7c78]", ink: "text-[#0b5559]", bg: "bg-[#e6f4f3]", ring: "ring-[#0c7c78]/15", icon: Building2 },
          { key: "investor", label: adminCopy.accountRoles.investor, value: summary.investor, chip: "bg-[#465ab4]", ink: "text-[#2f3f8f]", bg: "bg-[#eef1fb]", ring: "ring-[#465ab4]/15", icon: Briefcase },
          { key: "advisor", label: adminCopy.accountRoles.advisor, value: summary.advisor, chip: "bg-[#e3a008]", ink: "text-[#b26b00]", bg: "bg-[#fdf4e3]", ring: "ring-[#e3a008]/20", icon: Handshake },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.key} className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-4 ring-1 ${card.bg} ${card.ring}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${card.chip}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={`block text-2xl leading-7 font-semibold tabular-nums ${card.ink}`}>{card.value}</span>
                <span className="block text-xs leading-4 text-[#3d4a63]">{card.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mb-4 flex flex-col gap-2 lg:hidden">
        <ChipRow>
          <FilterChip selected={role === "all"} onClick={() => setRole("all")}>{adminCopy.roleAll}</FilterChip>
          <FilterChip selected={role === "seller"} onClick={() => setRole("seller")}>{adminCopy.accountRoles.seller}</FilterChip>
          <FilterChip selected={role === "investor"} onClick={() => setRole("investor")}>{adminCopy.accountRoles.investor}</FilterChip>
          <FilterChip selected={role === "advisor"} onClick={() => setRole("advisor")}>{adminCopy.accountRoles.advisor}</FilterChip>
        </ChipRow>
        <ChipRow>
          <FilterChip selected={state === "all"} onClick={() => setState("all")}>{adminCopy.accountStateAll}</FilterChip>
          <FilterChip selected={state === "active"} onClick={() => setState("active")}>{adminCopy.accountStateActive}</FilterChip>
          <FilterChip selected={state === "suspended"} onClick={() => setState("suspended")}>{adminCopy.accountStateSuspended}</FilterChip>
          <FilterChip selected={state === "pending"} onClick={() => setState("pending")}>{adminCopy.accountStatePending}</FilterChip>
        </ChipRow>
      </div>
      <p className="mb-3 text-xs text-[#667085] lg:hidden">
        {summary.pending} altas pendientes · {summary.suspended} suspendidas
      </p>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

function accountState(account: AdminAccountRow): { label: string; tone: string } | null {
  if (account.suspended) return { label: "Suspendida", tone: "text-[#8d2424]" };
  if (!account.onboarded) return { label: adminCopy.accountStatePending, tone: "text-[#8a6112]" };
  return null;
}

const roleTones: Record<string, string> = {
  seller: "bg-[#e6f4f3] text-[#0f6e6a]",
  investor: "bg-[#e8ecfa] text-[#33459a]",
  advisor: "bg-[#f3e9fb] text-[#6b3596]",
  admin: "bg-[#1c2740] text-white",
};

function roleLabel(role: string | null): string {
  if (role && role in adminCopy.accountRoles) return adminCopy.accountRoles[role as keyof typeof adminCopy.accountRoles];
  return adminCopy.roles.none;
}

function InfoRow({ label, children, open = false }: { label: string; children: React.ReactNode; open?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-1.5 text-xs">
      <dt className="shrink-0 text-[#667085]">{label}</dt>
      <dd className={`min-w-0 text-right font-medium text-[#1c2740] ${open ? "" : "truncate"}`}>{children}</dd>
    </div>
  );
}

function AccountCard({ account, self }: { account: AdminAccountRow; self: boolean }) {
  const state = accountState(account);
  const role = roleLabel(account.role);
  // The pending line already says "Alta pendiente"; the role pill would repeat it.
  const showRole = role !== state?.label;
  return (
    <article className="group/account relative flex w-full flex-col rounded-2xl border border-[#e7eaee] bg-white p-4">
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
        <span className="flex shrink-0 flex-col items-end gap-1">
          {showRole ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleTones[account.role ?? ""] ?? "bg-[#eef1f5] text-[#475467]"}`}>
              {role}
            </span>
          ) : null}
          {state ? (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${state.tone}`}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {state.label}
            </span>
          ) : null}
        </span>
      </header>
      <dl className="mt-3 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
        {account.role === "investor" ? (
          <InfoRow label="Plan" open>{self ? adminCopy.plans[account.plan] : <PlanPicker userId={account.id} plan={account.plan} />}</InfoRow>
        ) : null}
        {account.role === "seller" ? (
          <InfoRow label="Empresas">
            <span className="tabular-nums">{account.companies === 1 ? "1 empresa" : `${account.companies} empresas`}</span>
          </InfoRow>
        ) : null}
        <InfoRow label="Teléfono">{account.phone ?? "—"}</InfoRow>
        <InfoRow label="Alta">{joined.format(new Date(account.createdAt))}</InfoRow>
        <InfoRow label={adminCopy.referralSourceLabel}>{account.onboarded ? (account.referralSource ?? adminCopy.referralSourceEmpty) : "—"}</InfoRow>
      </dl>
      {self ? null : <SuspensionButton userId={account.id} name={account.name} suspended={account.suspended} />}
    </article>
  );
}
