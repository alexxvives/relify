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
import { formatCardEur } from "@/lib/money";
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
          <div className="hidden overflow-x-auto rounded-2xl border border-[#e7eaee] bg-white lg:block">
            <table className="w-full text-sm text-[#1c2740]">
              <caption className="sr-only">{adminCopy.companiesTitle}</caption>
              <thead className="border-b border-[#eef1f4] bg-[#fafbfd] text-left text-xs text-[#667085]">
                <tr>
                  <SortHeader label="Empresa" active={sort.key === "codename"} dir={sort.dir} onClick={() => sortBy("codename")} />
                  <SortHeader label="Estado" active={sort.key === "status"} dir={sort.dir} onClick={() => sortBy("status")} />
                  <th scope="col" className="px-4 py-3 font-medium">Propietario</th>
                  <SortHeader label={companyCopy.revenueLabel} numeric active={sort.key === "revenueCents"} dir={sort.dir} onClick={() => sortBy("revenueCents")} />
                  <SortHeader label={companyCopy.ebitdaLabel} numeric active={sort.key === "ebitdaCents"} dir={sort.dir} onClick={() => sortBy("ebitdaCents")} />
                  <SortHeader label={companyCopy.askingPriceLabel} numeric active={sort.key === "askingPriceCents"} dir={sort.dir} onClick={() => sortBy("askingPriceCents")} />
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1f4]">
                {sorted.map((project) => (
                  <tr key={project.id} className="hover:bg-[#fafbfd]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/empresas/${project.slug}`} className="font-semibold hover:underline">
                        {project.codename}
                      </Link>
                      <p className="text-xs text-[#667085]">{project.region}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${statusTone[project.status]}`}>{projectStatus(project.status)}</span>
                        {project.verified ? <VerifiedBadge /> : null}
                      </span>
                    </td>
                    <td className="max-w-56 truncate px-4 py-3 text-[#3d4a63]">{project.ownerEmail ?? adminCopy.ownerMissing}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCardEur(project.revenueCents)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCardEur(project.ebitdaCents)}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatCardEur(project.askingPriceCents)}</td>
                    <td className="px-4 py-3">
                      <CompanyActions project={project} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-3 lg:hidden md:grid-cols-2">
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

function SortHeader({ label, active, dir, numeric = false, onClick }: { label: string; active: boolean; dir: 1 | -1; numeric?: boolean; onClick: () => void }) {
  const Icon = !active ? ArrowUpDown : dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (dir === 1 ? "ascending" : "descending") : "none"} className={`px-4 py-3 font-medium ${numeric ? "text-right" : ""}`}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded hover:text-[#1c2740] focus-visible:ring-3 focus-visible:ring-[#5c4de0]/30 focus-visible:outline-none">
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  );
}

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

/** Phone layout: one compact card per company; identity details live on the company page. */
function CompanyCard({ project }: { project: AdminCompanyRow }) {
  return (
    <article className="rounded-2xl border border-[#e7eaee] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-[#1c2740]">{project.codename}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[project.status]}`}>{projectStatus(project.status)}</span>
        {project.verified ? <VerifiedBadge /> : null}
      </div>
      <p className="mt-1 truncate text-sm text-[#667085]">{[project.region, project.ownerEmail ?? adminCopy.ownerMissing].join(" · ")}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        {[
          { label: companyCopy.revenueLabel, value: formatCardEur(project.revenueCents) },
          { label: companyCopy.ebitdaLabel, value: formatCardEur(project.ebitdaCents) },
          { label: "Precio", value: formatCardEur(project.askingPriceCents) },
        ].map((figure) => (
          <div key={figure.label} className="min-w-0 rounded-xl bg-[#f7f8fb] px-3 py-2">
            <dt className="truncate text-xs text-[#667085]">{figure.label}</dt>
            <dd className="font-semibold whitespace-nowrap tabular-nums">{figure.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <CompanyActions project={project} />
      </div>
    </article>
  );
}
