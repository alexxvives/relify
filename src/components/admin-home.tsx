import Link from "next/link";
import { Heart, MessageSquare, ShieldCheck, Unlock, Wallet } from "lucide-react";
import { CountDonut, type DonutPalette } from "@/components/admin-charts";
import { SectorTreemap } from "@/components/sector-treemap";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { AdminDashboard } from "@/server/getAdminDashboard";

const cardClass = "block rounded-2xl border border-[#e7eaee] bg-white p-5 hover:border-[#465ab4]";

export function AdminHome({ overview }: { overview: AdminDashboard }) {
  const accounts = overview.roles.reduce((sum, row) => sum + row.count, 0);
  const finished = Math.max(accounts - overview.unfinished, 0);
  const roles = overview.roles.map((row) => ({
    label: adminCopy.roles[row.role],
    value: row.count,
  }));
  const onboarding = [
    { label: adminCopy.pendingOnboarding, value: overview.unfinished },
    { label: adminCopy.onboarded, value: finished },
  ];
  const listings = [
    { label: adminCopy.statusPublished, value: overview.published },
    { label: adminCopy.statusDraft, value: overview.drafts },
    { label: adminCopy.statusPending, value: overview.pending },
  ];
  const plans = overview.plans.map((row) => ({
    label: adminCopy.plans[row.plan],
    value: row.count,
  }));
  const activity = [
    { label: adminCopy.funnel.accesses, value: overview.accesses, href: "/admin/conexiones", icon: Unlock, tone: "bg-[#eef2ff] text-[#163a8a]" },
    { label: adminCopy.funnel.ndas, value: overview.ndas, href: "/admin/conexiones", icon: ShieldCheck, tone: "bg-[#e8f6ee] text-[#0d5c38]" },
    { label: adminCopy.funnel.messages, value: overview.messages, href: "/admin/conexiones", icon: MessageSquare, tone: "bg-[#f4f5f8] text-[#1c2740]" },
    { label: adminCopy.favoritesTitle, value: overview.favorites, href: null, icon: Heart, tone: "bg-[#fdeeee] text-[#8d2424]" },
    { label: adminCopy.quotesTitle, value: overview.quotes, href: "/admin/facturacion", icon: Wallet, tone: "bg-[#fff4e8] text-[#9a4a08]" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartLink href="/admin/cuentas" title={adminCopy.rolesTitle} total={accounts} palette="blue" rows={roles} />
        <ChartLink href="/admin/cuentas" title={adminCopy.unfinishedTitle} total={accounts} palette="green" rows={onboarding} />
        <ChartLink
          href="/admin/empresas"
          title={adminCopy.listingsTitle}
          total={overview.published + overview.drafts + overview.pending}
          palette="orange"
          rows={listings}
          aside={overview.publishedAskingCents > 0 ? formatEur(overview.publishedAskingCents) : undefined}
        />
        <ChartLink
          href="/admin/facturacion"
          title={adminCopy.plansTitle}
          total={plans.reduce((sum, row) => sum + row.value, 0)}
          palette="red"
          rows={plans}
        />
      </div>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.activityTitle}</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {activity.map((item) => (
            <li key={item.label}>
              <ActivityTile item={item} />
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1c2740]">
          <Link href="/admin/empresas" className="hover:text-[#465ab4]">
            {adminCopy.sectorsTitle}
          </Link>
        </h2>
        <SectorTreemap sectors={overview.sectors} empty={adminCopy.sectorsEmpty} />
      </section>
    </div>
  );
}

function ChartLink({
  href,
  title,
  total,
  palette,
  rows,
  aside,
}: {
  href: string;
  title: string;
  total: number;
  palette: DonutPalette;
  rows: { label: string; value: number }[];
  aside?: string;
}) {
  return (
    <Link href={href} className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-[#1c2740]">{title}</h2>
        <div className="flex items-start gap-4">
          {aside ? (
            <p className="text-right">
              <span className="block text-xs text-[#667085]">{adminCopy.asking}</span>
              <span className="text-sm font-semibold tracking-tight text-[#1c2740] tabular-nums">{aside}</span>
            </p>
          ) : null}
          <p className="text-right">
            <span className="block text-xs text-[#667085]">{adminCopy.totalLabel}</span>
            <span className="text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{total}</span>
          </p>
        </div>
      </div>
      {total === 0 ? <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p> : <CountDonut rows={rows} palette={palette} />}
    </Link>
  );
}

function ActivityTile({
  item,
}: {
  item: { label: string; value: number; href: string | null; icon: typeof Heart; tone: string };
}) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-3xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
        <p className="mt-1 text-sm text-[#3d4a63]">{item.label}</p>
      </div>
      <item.icon className="size-8 shrink-0" aria-hidden />
    </>
  );
  const className = `flex h-full items-center justify-between gap-3 rounded-2xl px-4 py-4 ${item.tone}`;

  if (!item.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={item.href} className={`${className} transition hover:opacity-80`}>
      {body}
    </Link>
  );
}
