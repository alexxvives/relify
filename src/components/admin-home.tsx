import Link from "next/link";
import { ChevronRight, Heart, MessageSquare, ShieldCheck, Unlock, Wallet } from "lucide-react";
import { CountBars, type DonutPalette } from "@/components/admin-charts";
import { ActivityTiles, share } from "@/components/activity-tiles";
import { SectorTreemap } from "@/components/sector-treemap";
import { CountBadge } from "@/components/ui/badge";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminDashboard } from "@/server/getAdminDashboard";
import { Card } from "@/components/ui/form";

const cardClass = "block rounded-2xl border border-[#e7eaee] bg-white p-5";

export function AdminHome({ overview }: { overview: AdminDashboard }) {
  const accounts = overview.roles.reduce((sum, row) => sum + row.count, 0);
  const finished = Math.max(accounts - overview.unfinished, 0);
  // Admin seats are staff, not users of the marketplace: left out of "Cuentas por rol".
  // t91: accounts without a role ("Alta pendiente") already have their own onboarding card; only real roles here.
  const userRoles = overview.roles.filter((row) => row.role !== "admin" && row.role !== "none");
  const userAccounts = userRoles.reduce((sum, row) => sum + row.count, 0);
  const roles = userRoles.map((row) => ({
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
  const freshNote = (count: number, rest: string) => (count > 0 ? `${count} ${count === 1 ? "nuevo" : "nuevos"} · ${rest}` : rest);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#1c2740]">{adminCopy.activityTitle}</h2>
        <p className="mt-1 text-sm text-[#667085]">De los accesos a los mensajes y los presupuestos.</p>
        <ActivityTiles
          tiles={[
            { label: adminCopy.funnel.accesses, value: overview.accesses, icon: Unlock, tone: "sky", ratio: overview.accesses > 0 ? 1 : 0, caption: freshNote(overview.fresh.accesses, "Peticiones de acceso"), href: "/admin/conexiones" },
            { label: adminCopy.funnel.ndas, value: overview.ndas, icon: ShieldCheck, tone: "emerald", ratio: share(overview.ndas, overview.accesses), caption: freshNote(overview.fresh.ndas, `${overview.ndas} de ${overview.accesses} accesos`), href: "/admin/conexiones" },
            { label: adminCopy.funnel.messages, value: overview.messages, icon: MessageSquare, tone: "indigo", ratio: share(overview.messages, overview.ndas), caption: freshNote(overview.fresh.messages, `${overview.messages} tras el NDA`), href: "/admin/conexiones" },
            { label: adminCopy.favoritesTitle, value: overview.favorites, icon: Heart, tone: "orange", ratio: share(overview.favorites, overview.accesses), caption: freshNote(overview.fresh.favorites, "Empresas guardadas") },
            { label: adminCopy.quotesTitle, value: overview.quotes, icon: Wallet, tone: "amber", ratio: share(overview.quotes, Math.max(overview.accesses, overview.quotes)), caption: freshNote(overview.fresh.quotes, "Presupuestos pedidos"), href: "/admin/facturacion" },
          ]}
        />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartLink href="/admin/cuentas" title={adminCopy.rolesTitle} fresh={overview.fresh.accounts} total={userAccounts} palette="blue" rows={roles} />
        <ChartLink href="/admin/cuentas" title={adminCopy.unfinishedTitle} total={accounts} palette="green" rows={onboarding} />
        <ChartLink
          href="/admin/empresas"
          title={adminCopy.listingsTitle}
          fresh={overview.fresh.companies}
          total={overview.published + overview.drafts + overview.pending}
          palette="orange"
          rows={listings}
        />
        <ChartLink
          href="/admin/facturacion"
          title={adminCopy.plansTitle}
          total={plans.reduce((sum, row) => sum + row.value, 0)}
          palette="red"
          rows={plans}
        />
      </div>
      <Card>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-2xl font-semibold text-[#1c2740]">{adminCopy.sectorsTitle}</h2>
          <SectionLink href="/admin/empresas" title={adminCopy.sectorsTitle} />
        </div>
        <SectorTreemap sectors={overview.sectors} empty={adminCopy.sectorsEmpty} />
      </Card>
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
  fresh = 0,
}: {
  href: string;
  title: string;
  fresh?: number;
  total: number;
  palette: DonutPalette;
  rows: { label: string; value: number }[];
  aside?: string;
}) {
  return (
    // t91: the card is read-only; only the small "Ver sección" link beside the title navigates.
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#1c2740]">
            {title}
            {fresh > 0 ? <CountBadge count={fresh} label={`${fresh} nuevos`} /> : null}
          </h2>
          <SectionLink href={href} title={title} />
        </div>
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
      {total === 0 ? <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p> : <CountBars rows={rows} palette={palette} />}
    </section>
  );
}

function SectionLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      aria-label={`Ver sección: ${title}`}
      className="inline-flex items-center gap-0.5 rounded text-sm font-medium text-[#0f766e] hover:text-[#1c2740] hover:underline focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
    >
      Ver sección
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}

