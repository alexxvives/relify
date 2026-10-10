"use client";

import { useState } from "react";
import { ApproveButton, UnpublishButton } from "@/components/admin-controls";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { formatEur } from "@/lib/money";
import type { AdminCompanyRow } from "@/server/listAdminCompanies";

type CompanyStatusFilter = "all" | "published" | "pending" | "draft";

const fieldClass =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] bg-white px-3 text-base text-[#1c2740] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20";

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
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-2xl border border-[#e7eaee] bg-white p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.7fr)] sm:items-end">
        <label htmlFor="admin-company-search" className="flex flex-col gap-1.5 text-xs font-medium text-[#667085]">
          {adminCopy.searchLabel}
          <input
            id="admin-company-search"
            type="search"
            value={query}
            placeholder={adminCopy.searchCompanies}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className={fieldClass}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#667085]">{adminCopy.statusLabel}</span>
          <FilterSelect
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
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((project) => (
            <li key={project.id} className="rounded-2xl border border-[#e7eaee] bg-white px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-base font-semibold text-[#1c2740]">{project.codename}</p>
                <p className="text-sm text-[#3d4a63]">
                  {project.region} · {projectStatus(project.status)} · {formatEur(project.askingPriceCents)}
                </p>
              </div>
              <p className="mt-1 text-sm text-[#667085]">{project.ownerEmail ?? adminCopy.ownerMissing}</p>
              <dl className="mt-3 grid gap-2 text-sm text-[#1c2740] sm:grid-cols-2">
                <IdentityItem label={adminCopy.legalName} value={project.legalName} />
                <IdentityItem label={adminCopy.cif} value={project.cif} />
                <IdentityItem label={adminCopy.address} value={project.address} />
                <IdentityItem label={adminCopy.shareholders} value={project.shareholders.join(", ")} />
              </dl>
              <p className="mt-3 text-xs font-medium text-[#667085]">{adminCopy.files}</p>
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
    </div>
  );
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
