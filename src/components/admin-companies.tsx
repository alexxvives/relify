"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { StatusPillToggle } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { companyCopy } from "@/lib/company-copy";
import { MarketCard, marketGridClass } from "@/components/market-card";
import type { AdminCompanyRow } from "@/server/listAdminCompanies";
import { adminNewRing } from "@/components/admin-new";

type CompanyStatusFilter = "all" | "published" | "pending" | "draft";

const statusTone: Record<AdminCompanyRow["status"], string> = {
  published: "bg-[#e8f6ee] text-[#17663a]",
  pending: "bg-[#fff4d6] text-[#8a6112]",
  draft: "bg-[#f4f5f7] text-[#667085]",
};

function isStatusFilter(value: string): value is CompanyStatusFilter {
  return value === "all" || value === "published" || value === "pending" || value === "draft";
}

function projectStatus(status: AdminCompanyRow["status"]): string {
  if (status === "published") {
    return adminCopy.statusPublished;
  }

  if (status === "pending") {
    return adminCopy.statusPending;
  }

  return adminCopy.statusDraft;
}

export function AdminCompanies({ projects, sabiOnly = false }: { projects: AdminCompanyRow[]; sabiOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const [sabi, setSabi] = useState(sabiOnly);
  const sabiCount = projects.filter((project) => project.sabiPending).length;
  const [status, setStatus] = useState<CompanyStatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdMs", dir: -1 });
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = projects.filter((project) => {
    if (status !== "all" && project.status !== status) {
      return false;
    }

    if (sabi && !project.sabiPending) {
      return false;
    }

    if (needle.length === 0) {
      return true;
    }

    const haystack = [project.codename, project.region, project.ownerEmail ?? "", project.legalName, project.cif]
      .join(" ")
      .toLocaleLowerCase("es");
    return haystack.includes(needle);
  });
  const sorted = [...visible].sort((left, right) => {
    const a = left[sort.key];
    const b = right[sort.key];
    const order = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "es");
    return order * sort.dir;
  });
  function sortBy(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: key === "codename" || key === "status" ? 1 : -1 }));
  }

  return (
    <div>
      <AdminPageHeader title={adminCopy.companiesTitle}>
        <AdminSearchField
          id="admin-company-search"
          label={adminCopy.searchLabel}
          value={query}
          placeholder={adminCopy.searchCompanies}
          onChange={setQuery}
        />
        <div className="w-44">
          <FilterSelect
            compact
            label={adminCopy.statusLabel}
            value={status}
            options={[
              { value: "all", label: adminCopy.statusAll },
              { value: "published", label: adminCopy.statusPublished },
              { value: "pending", label: adminCopy.statusPending },
              { value: "draft", label: adminCopy.statusDraft },
            ]}
            onValueChange={(next) => {
              if (isStatusFilter(next)) {
                setStatus(next);
              }
            }}
          />
        </div>
        <button
          type="button"
          aria-pressed={sabi}
          onClick={() => {
            setSabi((current) => !current);
          }}
          className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium ${sabi ? "border-[#9a5b00] bg-[#fff4e5] text-[#7a4700]" : "border-[#e7eaee] bg-white text-[#1c2740]"}`}
        >
          {adminCopy.sabiPendingFilter}
          <span className={`rounded-full px-1.5 text-xs font-semibold ${sabi ? "bg-[#9a5b00] text-white" : "bg-[#f4f5f7] text-[#667085]"}`}>{sabiCount}</span>
        </button>
      </AdminPageHeader>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#667085]">
            <span>Ordenar:</span>
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => sortBy(option.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${sort.key === option.key ? "border-[#465ab4] text-[#1c2740]" : "border-[#e7eaee] bg-white"}`}
              >
                {option.label}
                {sort.key === option.key ? (sort.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />) : <ArrowUpDown className="size-3.5" aria-hidden />}
              </button>
            ))}
          </div>
          <ul className={marketGridClass}>
            {sorted.map((project) => (
              <li key={project.id}>
                <CompanyCard project={project} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type SortKey = "createdMs" | "codename" | "status" | "revenueCents" | "ebitdaCents" | "askingPriceCents";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "createdMs", label: "Alta" },
  { key: "codename", label: "Empresa" },
  { key: "status", label: "Estado" },
  { key: "revenueCents", label: companyCopy.revenueLabel },
  { key: "ebitdaCents", label: companyCopy.ebitdaLabel },
  { key: "askingPriceCents", label: companyCopy.askingPriceLabel },
];

/** Marketplace-style card (unblurred for admin) linking to the admin company page, plus admin status and actions. */
function CompanyCard({ project }: { project: AdminCompanyRow }) {
  const since = project.sabiPending && project.sabiRequestedAt
    ? new Date(project.sabiRequestedAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;
  const ring = project.sabiPending
    ? "border-[#e5484d] bg-[#fff5f5] shadow-[0_0_0_3px_rgba(229,72,77,0.18),0_0_18px_rgba(229,72,77,0.25)]"
    : project.isNew
      ? adminNewRing
      : "border-transparent";

  return (
    <div
      data-sabi-pending={project.sabiPending ? "true" : undefined}
      title={project.sabiPending ? `${adminCopy.sabiPendingBadge}${since ? ` · ${adminCopy.sabiPendingSince} ${since}` : ""}` : undefined}
      className={`h-full rounded-2xl border p-2 ${ring}`}
    >
      <div className="relative">
        <MarketCard project={project.card} href={`/admin/empresas/${project.slug}`} />
        <div className="absolute top-3 right-3 z-10">
          <StatusPillToggle projectId={project.id} status={project.status} label={projectStatus(project.status)} tone={statusTone[project.status]} />
        </div>
      </div>
      <p className="mt-2 truncate px-1 text-xs text-[#5c6b78]" title={project.legalName || undefined}>
        <span className="font-semibold text-[#1c2740]">{project.legalName || "Razón social pendiente"}</span>
        {project.cif ? <span> · {project.cif}</span> : null}
      </p>
      {project.sabiPending ? <span className="sr-only">{adminCopy.sabiPendingBadge}</span> : null}
    </div>
  );
}
