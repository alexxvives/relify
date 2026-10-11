import type { ReactNode } from "react";
import Link from "next/link";
import { CountBars, CountDonut } from "@/components/admin-charts";
import { IndustryTreemap } from "@/components/industry-treemap";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { AdminDashboard } from "@/server/getAdminDashboard";

const cardClass = "block rounded-2xl border border-[#e7eaee] bg-white p-5 hover:border-[#465ab4]";

const roleColors: Record<AdminDashboard["roles"][number]["role"], string> = {
  seller: "#465ab4",
  investor: "#1c2740",
  advisor: "#7c8ec4",
  admin: "#17663a",
  none: "#c5cce0",
};

const planColors: Record<AdminDashboard["plans"][number]["plan"], string> = {
  none: "#c5cce0",
  limited: "#465ab4",
  unlimited: "#1c2740",
};

export function AdminHome({ overview }: { overview: AdminDashboard }) {
  const accounts = overview.roles.reduce((sum, row) => sum + row.count, 0);
  const finished = Math.max(accounts - overview.unfinished, 0);
  const stats = [
    { label: adminCopy.users, value: String(accounts), href: "/admin/cuentas" },
    { label: adminCopy.published, value: String(overview.published), href: "/admin/empresas" },
    { label: adminCopy.drafts, value: String(overview.drafts), href: "/admin/empresas" },
    { label: adminCopy.asking, value: formatEur(overview.publishedAskingCents), href: "/admin/empresas" },
  ];
  const roles = overview.roles.map((row) => ({
    label: roleLabel(row.role),
    value: row.count,
    color: roleColors[row.role],
  }));
  const onboarding = [
    { label: adminCopy.pendingOnboarding, value: overview.unfinished, color: "#c47a12" },
    { label: adminCopy.onboarded, value: finished, color: "#465ab4" },
  ];
  const listings = [
    { label: adminCopy.statusPublished, value: overview.published, color: "#17663a" },
    { label: adminCopy.statusDraft, value: overview.drafts, color: "#8b95a7" },
    { label: adminCopy.statusPending, value: overview.pending, color: "#c47a12" },
  ];
  const plans = overview.plans.map((row) => ({
    label: adminCopy.plans[row.plan],
    value: row.count,
    color: planColors[row.plan],
  }));
  const funnel = [
    { label: adminCopy.funnel.accesses, value: overview.accesses },
    { label: adminCopy.funnel.ndas, value: overview.ndas },
    { label: adminCopy.funnel.messages, value: overview.messages },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="block rounded-2xl border border-[#e7eaee] bg-white px-4 py-4 hover:border-[#465ab4]">
              <p className="text-xs text-[#667085]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartLink href="/admin/cuentas" title={adminCopy.rolesTitle} total={accounts}>
          <CountDonut rows={roles} />
        </ChartLink>
        <ChartLink href="/admin/cuentas" title={adminCopy.unfinishedTitle} total={accounts}>
          <CountDonut rows={onboarding} />
        </ChartLink>
        <ChartLink href="/admin/empresas" title={adminCopy.listingsTitle} total={overview.published + overview.drafts + overview.pending}>
          <CountDonut rows={listings} />
        </ChartLink>
        <ChartLink href="/admin/facturacion" title={adminCopy.plansTitle} total={plans.reduce((sum, row) => sum + row.value, 0)}>
          <CountDonut rows={plans} />
        </ChartLink>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartLink href="/admin/conexiones" title={adminCopy.funnelTitle} total={overview.accesses + overview.ndas + overview.messages}>
          <CountBars rows={funnel} funnel />
        </ChartLink>
        <section className={cardClass}>
          <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.favoritesTitle}</h2>
          {overview.favorites === 0 ? (
            <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p>
          ) : (
            <CountBars rows={[{ label: adminCopy.favoritesTitle, value: overview.favorites }]} />
          )}
        </section>
        <ChartLink href="/admin/facturacion" title={adminCopy.quotesTitle} total={overview.quotes}>
          <CountBars rows={[{ label: adminCopy.quotesTitle, value: overview.quotes }]} />
        </ChartLink>
      </div>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1c2740]">
          <Link href="/admin/empresas" className="hover:text-[#465ab4]">
            {adminCopy.sectorsTitle}
          </Link>
        </h2>
        <IndustryTreemap sectors={overview.sectors} empty={adminCopy.sectorsEmpty} />
      </section>
    </div>
  );
}

function ChartLink({
  href,
  title,
  total,
  children,
}: {
  href: string;
  title: string;
  total: number;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cardClass}>
      <h2 className="text-2xl font-semibold text-[#1c2740]">{title}</h2>
      {total === 0 ? <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p> : children}
    </Link>
  );
}

function roleLabel(role: AdminDashboard["roles"][number]["role"]): string {
  return adminCopy.roles[role];
}
