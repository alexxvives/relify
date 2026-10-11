"use client";

import { useState } from "react";
import Link from "next/link";
import { ApproveButton, UnpublishButton } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { companyCopy } from "@/lib/company-copy";
import { formatEur } from "@/lib/money";
import type { AdminCompanyRow } from "@/server/listAdminCompanies";

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
        <ul className="grid gap-4">
          {visible.map((project) => (
            <li key={project.id}>
              <CompanyCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const fichaClass =
  "inline-flex h-9 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#1c2740]";

function CompanyCard({ project }: { project: AdminCompanyRow }) {
  const figures = [
    { label: companyCopy.revenueLabel, value: formatEur(project.revenueCents) },
    { label: companyCopy.ebitdaLabel, value: formatEur(project.ebitdaCents) },
    { label: companyCopy.adjustedEbitdaLabel, value: formatEur(project.adjustedEbitdaCents) },
    { label: companyCopy.askingPriceLabel, value: formatEur(project.askingPriceCents) },
  ];
  const identity = [
    { label: adminCopy.legalName, value: project.legalName },
    { label: adminCopy.cif, value: project.cif },
    { label: adminCopy.address, value: project.address },
    { label: adminCopy.shareholders, value: project.shareholders.join(", ") },
  ];

  return (
    <article className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-[#1c2740]">{project.codename}</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[project.status]}`}>
              {projectStatus(project.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#667085]">
            {[project.region, project.ownerEmail ?? adminCopy.ownerMissing].filter((part) => part.trim().length > 0).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/empresas/${project.slug}`} className={fichaClass}>
            {adminCopy.viewCompany}
          </Link>
          {project.status === "published" ? <UnpublishButton projectId={project.id} /> : null}
          {project.status === "pending" ? <ApproveButton projectId={project.id} /> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <dl className="grid min-w-0 flex-1 gap-y-2 text-sm text-[#1c2740]">
          {identity.map((item) => (
            <div key={item.label} className="grid gap-x-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
              <dt className="text-[#667085]">{item.label}</dt>
              <dd className="break-words">{item.value.trim().length > 0 ? item.value : adminCopy.identityEmpty}</dd>
            </div>
          ))}
        </dl>
        <dl className="grid grid-cols-2 gap-2 lg:w-80 lg:shrink-0">
          {figures.map((figure) => (
            <div key={figure.label} className="rounded-xl bg-[#f7f8fb] px-3 py-2">
              <dt className="text-xs text-[#667085]">{figure.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-[#1c2740] tabular-nums">{figure.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
