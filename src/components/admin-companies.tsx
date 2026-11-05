"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter } from "lucide-react";
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

export function AdminCompanies({ projects }: { projects: AdminCompanyRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompanyStatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdMs", dir: -1 });
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
        <SortMenu sort={sort} onSort={sortBy} />
      </AdminPageHeader>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.empty}</p>
      ) : (
        <ul className={marketGridClass}>
            {sorted.map((project) => (
              <li key={project.id}>
                <CompanyCard project={project} />
              </li>
            ))}
        </ul>
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

function SortMenu({ sort, onSort }: { sort: { key: SortKey; dir: 1 | -1 }; onSort: (key: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = sortOptions.find((option) => option.key === sort.key);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={current ? `Ordenar: ${current.label}` : "Ordenar"}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="inline-flex size-9 items-center justify-center rounded-full border border-[#e7eaee] bg-white text-[#1c2740] outline-none hover:border-[#465ab4] focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20"
      >
        <ListFilter className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          id={listId}
          role="menu"
          aria-label="Ordenar"
          className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-[#e6e9f0] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.45)]"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-[#667085]">Ordenar</p>
          {sortOptions.map((option) => {
            const selected = option.key === sort.key;
            return (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  onSort(option.key);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${selected ? "font-semibold text-[#1c2740]" : "text-[#3d4a63]"} hover:bg-[#f4f7ff]`}
              >
                {option.label}
                {selected ? (sort.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />) : <ArrowUpDown className="size-3.5 text-[#98a2b3]" aria-hidden />}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Marketplace-style card (unblurred for admin) linking to the admin company page, plus admin status and actions. */
function CompanyCard({ project }: { project: AdminCompanyRow }) {
  const ring = project.isNew ? adminNewRing : "border-transparent";
  const sabiDraft = project.status === "draft" && project.sabiPending;
  const label = project.status === "pending" ? adminCopy.approvalRequired : sabiDraft ? adminCopy.sabiPendingTag : projectStatus(project.status);
  const tone = project.status === "pending" ? "bg-[#465ab4] text-white" : sabiDraft ? "bg-[#fff4e5] text-[#7a4700]" : statusTone[project.status];
  const since = sabiDraft && project.sabiRequestedAt
    ? new Date(project.sabiRequestedAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      data-sabi-pending={project.sabiPending ? "true" : undefined}
      className={`flex h-full flex-col rounded-2xl border p-2 ${ring}`}
    >
      <p className="mb-2 truncate px-1 text-center text-sm text-[#5c6b78]" title={project.legalName || undefined}>
        <span className="font-semibold text-[#1c2740]">{project.legalName || "Razón social pendiente"}</span>
        {project.cif ? <span> · {project.cif}</span> : null}
      </p>
      <div className="relative flex-1">
        <MarketCard project={project.card} href={`/admin/empresas/${project.slug}`} hidePhotoTags />
        <div className="absolute top-3 right-3 z-10" title={since ? `${adminCopy.sabiPendingSince} ${since}` : undefined}>
          <StatusPillToggle projectId={project.id} status={project.status} label={label} tone={tone} />
        </div>
      </div>
    </div>
  );
}
