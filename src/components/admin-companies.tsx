"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { ApproveButton, UnpublishButton, VerifiedToggle } from "@/components/admin-controls";
import { VerifiedBadge } from "@/components/project-photo";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { companyCopy } from "@/lib/company-copy";
import { MarketCard } from "@/components/market-card";
import type { AdminCompanyRow } from "@/server/listAdminCompanies";
import { NewPill, adminNewRing } from "@/components/admin-new";

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

export function AdminCompanies({ projects }: { projects: AdminCompanyRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompanyStatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "codename", dir: 1 });
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = projects.filter((project) => {
    if (status !== "all" && project.status !== status) {
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
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

type SortKey = "codename" | "status" | "revenueCents" | "ebitdaCents" | "askingPriceCents";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "codename", label: "Empresa" },
  { key: "status", label: "Estado" },
  { key: "revenueCents", label: companyCopy.revenueLabel },
  { key: "ebitdaCents", label: companyCopy.ebitdaLabel },
  { key: "askingPriceCents", label: companyCopy.askingPriceLabel },
];

const fichaClass =
  "inline-flex h-9 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#1c2740]";

function CompanyActions({ project }: { project: AdminCompanyRow }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={`/admin/empresas/${project.slug}`} className={fichaClass}>
        {adminCopy.viewCompany}
      </Link>
      {project.status === "published" ? <UnpublishButton projectId={project.id} /> : null}
      {project.status === "pending" ? <ApproveButton projectId={project.id} /> : null}
      <VerifiedToggle target="project" id={project.id} verified={project.verified} />
    </div>
  );
}

/** Marketplace-style card (unblurred for admin) linking to the admin company page, plus admin status and actions. */
function CompanyCard({ project }: { project: AdminCompanyRow }) {
  return (
    <div className={`flex h-full flex-col gap-3 rounded-2xl border p-2 ${project.isNew ? adminNewRing : "border-transparent"}`}>
      <MarketCard project={project.card} href={`/admin/empresas/${project.slug}`} />
      <div className="flex flex-wrap items-center gap-2 px-1">
        {project.isNew ? <NewPill /> : null}
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[project.status]}`}>{projectStatus(project.status)}</span>
        {project.verified ? <VerifiedBadge /> : null}
        <span className="min-w-0 truncate text-xs text-[#667085]">{project.ownerEmail ?? adminCopy.ownerMissing}</span>
      </div>
      <div className="px-1 pb-1">
        <CompanyActions project={project} />
      </div>
    </div>
  );
}
