import { IndustryTreemap } from "@/components/industry-treemap";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { AdminOverview } from "@/server/getAdminOverview";

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" });

export function AdminHome({ overview }: { overview: AdminOverview }) {
  const stats = [
    { label: adminCopy.users, value: String(overview.roles.reduce((sum, row) => sum + row.count, 0)) },
    { label: adminCopy.published, value: String(overview.published) },
    { label: adminCopy.drafts, value: String(overview.drafts) },
    { label: adminCopy.asking, value: formatEur(overview.publishedAskingCents) },
  ];
  const pipeline = [
    { label: adminCopy.pipeline.accesses, value: overview.accesses },
    { label: adminCopy.pipeline.ndas, value: overview.ndas },
    { label: adminCopy.pipeline.messages, value: overview.messages },
    { label: adminCopy.pipeline.favorites, value: overview.favorites },
    { label: adminCopy.pipeline.quotes, value: overview.quotes },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <li key={item.label} className="rounded-2xl border border-[#e7eaee] bg-white px-4 py-4">
            <p className="text-xs text-[#667085]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{item.value}</p>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.rolesTitle}</h2>
          <p className="mt-1 text-sm text-[#667085]">
            {overview.unfinished === 1 ? "1 alta sin terminar" : `${overview.unfinished} altas sin terminar`}
          </p>
          <Meter rows={overview.roles.map((row) => ({ label: roleLabel(row.role), value: row.count }))} />
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.pipelineTitle}</h2>
          <Meter rows={pipeline} />
          <h3 className="mt-6 text-sm font-semibold text-[#1c2740]">{adminCopy.plansTitle}</h3>
          <Meter rows={overview.plans.map((row) => ({ label: adminCopy.plans[row.plan], value: row.count }))} />
        </section>
      </div>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.sectorsTitle}</h2>
        <IndustryTreemap sectors={overview.sectors} empty={adminCopy.sectorsEmpty} />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.projectsTitle}</h2>
          {overview.projects.length === 0 ? (
            <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {overview.projects.map((project) => (
                <li key={project.id} className="rounded-xl bg-[#f4f7ff] px-3 py-3">
                  <p className="text-sm font-semibold text-[#1c2740]">{project.codename}</p>
                  <p className="mt-1 text-sm text-[#667085]">
                    {project.region} · {project.status === "published" ? adminCopy.statusPublished : adminCopy.statusDraft} ·{" "}
                    {formatEur(project.askingPriceCents)}
                  </p>
                  <p className="mt-1 text-xs text-[#8b95a7]">{project.ownerEmail ?? adminCopy.ownerMissing}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.accountsTitle}</h2>
          {overview.accounts.length === 0 ? (
            <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {overview.accounts.map((account) => (
                <li key={account.id} className="rounded-xl bg-[#f4f7ff] px-3 py-3">
                  <p className="text-sm font-semibold text-[#1c2740]">{account.name}</p>
                  <p className="mt-1 text-sm text-[#667085]">
                    {account.email} · {roleLabel(account.role)}
                  </p>
                  <p className="mt-1 text-xs text-[#8b95a7]">{account.onboarded ? adminCopy.onboarded : adminCopy.pendingOnboarding}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.connectionsTitle}</h2>
        {overview.connections.length === 0 ? (
          <p className="mt-4 text-sm text-[#667085]">{adminCopy.empty}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {overview.connections.map((connection) => (
              <li key={connection.id} className="flex flex-col gap-1 rounded-xl bg-[#f4f7ff] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1c2740]">{connection.codename}</p>
                  <p className="mt-1 text-sm text-[#667085]">{connection.investorEmail}</p>
                </div>
                <p className="text-sm text-[#3d4a63]">
                  {connection.accepted ? adminCopy.accepted : adminCopy.waiting}
                  {" · "}
                  {connection.nda ? adminCopy.ndaYes : adminCopy.ndaNo}
                  {" · "}
                  {when.format(connection.requestedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function roleLabel(role: string | null): string {
  if (role === "seller" || role === "investor" || role === "advisor" || role === "admin" || role === "none") {
    return adminCopy.roles[role];
  }

  return adminCopy.roles.none;
}

function Meter({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[#3d4a63]">{row.label}</span>
            <span className="font-semibold text-[#1c2740] tabular-nums">{row.value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e6e9f0]">
            <div className="h-full rounded-full bg-[#465ab4]" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
