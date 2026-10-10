import Link from "next/link";
import { IndustryTreemap } from "@/components/industry-treemap";
import { ApproveButton, PlanForm, RoleForm, SuspensionButton, UnpublishButton } from "@/components/admin-controls";
import { adminCopy } from "@/lib/admin-copy";
import type { AdvisorScoreBreakdown } from "@/lib/advisor-directory";
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
      <AdvisorRanks advisors={overview.advisors} />
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
                    {project.region} · {projectStatus(project.status)} · {formatEur(project.askingPriceCents)}
                  </p>
                  <p className="mt-1 text-xs text-[#8b95a7]">{project.ownerEmail ?? adminCopy.ownerMissing}</p>
                  <dl className="mt-3 grid gap-2 text-sm text-[#1c2740] sm:grid-cols-2">
                    <IdentityItem label={adminCopy.legalName} value={project.legalName} />
                    <IdentityItem label={adminCopy.cif} value={project.cif} />
                    <IdentityItem label={adminCopy.address} value={project.address} />
                    <IdentityItem label={adminCopy.shareholders} value={project.shareholders.join(", ")} />
                  </dl>
                  <p className="mt-2 text-xs font-medium text-[#667085]">{adminCopy.files}</p>
                  {project.fileNames.length === 0 ? (
                    <p className="mt-1 text-sm text-[#8b95a7]">{adminCopy.identityEmpty}</p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-1">
                      {project.fileNames.map((fileName, index) => (
                        <li key={`${fileName}-${index}`} className="text-sm text-[#1c2740]">
                          {fileName}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3">
                    {project.status === "published" ? <UnpublishButton projectId={project.id} /> : null}
                    {project.status === "pending" ? <ApproveButton projectId={project.id} /> : null}
                  </div>
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
                  <p className="mt-1 text-xs text-[#8b95a7]">
                    {account.onboarded ? adminCopy.onboarded : adminCopy.pendingOnboarding}
                    {account.suspended ? ` · ${adminCopy.suspendedBadge}` : ""}
                    {account.role === "investor" ? ` · ${adminCopy.planCurrent}: ${adminCopy.plans[account.plan]}` : ""}
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    <SuspensionButton userId={account.id} suspended={account.suspended} />
                    <RoleForm userId={account.id} role={account.role} />
                    {account.role === "investor" ? <PlanForm userId={account.id} /> : null}
                  </div>
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
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-sm text-[#3d4a63]">
                    {connection.accepted ? adminCopy.accepted : adminCopy.waiting}
                    {" · "}
                    {connection.nda ? adminCopy.ndaYes : adminCopy.ndaNo}
                    {" · "}
                    {when.format(connection.requestedAt)}
                  </p>
                  <Link href={`/admin/chat/${connection.id}`} className="text-sm font-medium text-[#3d34b8]">
                    {adminCopy.readChat}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const scoreFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function scoreText(value: number): string {
  return scoreFormat.format(value);
}

function AdvisorRanks({ advisors }: { advisors: AdminOverview["advisors"] }) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{adminCopy.advisorsTitle}</h2>
      <p className="mt-1 text-sm text-[#667085]">{adminCopy.advisorsIntro}</p>
      {advisors.length === 0 ? (
        <p className="mt-4 text-sm text-[#667085]">{adminCopy.advisorsEmpty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {advisors.map((advisor) => (
            <li key={advisor.id} className="rounded-xl border border-[#e6eaf5] bg-[#f7f8fb] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#1c2740]">{advisor.name}</p>
                  <p className="mt-1 text-sm text-[#667085]">{advisor.email}</p>
                  {advisor.businessName.length > 0 ? (
                    <p className="mt-1 text-sm text-[#3d4a63]">
                      {adminCopy.advisorBusiness}: {advisor.businessName}
                    </p>
                  ) : null}
                </div>
                <p className="rounded-full bg-[#e8f6ee] px-3 py-1 text-sm font-semibold text-[#17663a]">
                  {advisor.place === null
                    ? adminCopy.advisorUnranked
                    : `${adminCopy.advisorPlace} ${advisor.place} de ${advisor.total}`}
                </p>
              </div>
              {advisor.breakdown ? <AdvisorScoreTable breakdown={advisor.breakdown} /> : null}
              <p className="mt-3 text-sm leading-6 text-[#1c2740]">{advisor.justification}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AdvisorScoreTable({ breakdown }: { breakdown: AdvisorScoreBreakdown }) {
  const rows = [
    { label: adminCopy.advisorCases, detail: String(breakdown.caseCount), value: scoreText(breakdown.cases) },
    { label: adminCopy.advisorServices, detail: String(breakdown.serviceCount), value: scoreText(breakdown.services) },
    {
      label: adminCopy.advisorDescription,
      detail: `${breakdown.descriptionLength} caracteres`,
      value: scoreText(breakdown.description),
    },
    { label: adminCopy.advisorSectors, detail: String(breakdown.sectorCount), value: scoreText(breakdown.sectors) },
    { label: adminCopy.advisorQuality, detail: "", value: scoreText(breakdown.quality) },
    { label: adminCopy.advisorReliability, detail: "", value: scoreText(breakdown.reliability) },
    { label: adminCopy.advisorRank, detail: "", value: scoreText(breakdown.rank) },
  ];

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 rounded-lg bg-white px-3 py-2">
          <dt className="text-sm text-[#3d4a63]">
            {row.label}
            {row.detail.length > 0 ? <span className="text-[#8b95a7]"> · {row.detail}</span> : null}
          </dt>
          <dd className="text-sm font-semibold text-[#1c2740] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function projectStatus(status: "draft" | "pending" | "published"): string {
  if (status === "published") {
    return adminCopy.statusPublished;
  }

  if (status === "pending") {
    return adminCopy.statusPending;
  }

  return adminCopy.statusDraft;
}

function IdentityItem({ label, value }: { label: string; value: string }) {
  const shown = value.trim().length > 0 ? value : adminCopy.identityEmpty;

  return (
    <div>
      <dt className="text-xs text-[#667085]">{label}</dt>
      <dd>{shown}</dd>
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
