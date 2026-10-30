"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, ListChecks } from "lucide-react";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { EmptySkeleton } from "@/components/ui/empty-skeleton";
import { waitlistCsv } from "@/lib/waitlist-csv";
import type { AdminWaitlistRow } from "@/server/listWaitlist";

type SortKey = "name" | "email" | "roleLabel" | "city" | "createdAt";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "email", label: "Correo" },
  { key: "roleLabel", label: "Perfil" },
  { key: "city", label: "Ciudad" },
  { key: "createdAt", label: "Fecha" },
];

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });

function formatWhen(iso: string): string {
  return when.format(new Date(iso));
}

export function AdminWaitlist({ entries }: { entries: AdminWaitlistRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "createdAt", dir: "desc" });
  const needle = query.trim().toLocaleLowerCase("es");

  const visible = useMemo(() => {
    const filtered = needle
      ? entries.filter((entry) => `${entry.name} ${entry.email} ${entry.roleLabel} ${entry.city}`.toLocaleLowerCase("es").includes(needle))
      : entries;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => a[sort.key].localeCompare(b[sort.key], "es", { sensitivity: "base" }) * factor);
  }, [entries, needle, sort]);

  const counts = useMemo(() => {
    const byRole = new Map<string, number>();
    for (const entry of entries) byRole.set(entry.roleLabel, (byRole.get(entry.roleLabel) ?? 0) + 1);
    return [...byRole.entries()];
  }, [entries]);

  function toggle(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "createdAt" ? "desc" : "asc" }));
  }

  function exportCsv() {
    const blob = new Blob([waitlistCsv(visible, formatWhen)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lista-de-espera-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <AdminPageHeader
        title="Lista de espera"
        note={`${entries.length} ${entries.length === 1 ? "registro" : "registros"}${counts.length ? ` · ${counts.map(([label, n]) => `${label} ${n}`).join(" · ")}` : ""}`}
      >
        <AdminSearchField id="admin-waitlist-search" label="Buscar" value={query} placeholder="Nombre, correo o ciudad" onChange={setQuery} />
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white hover:bg-[#2a3a5c] disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden />
          Exportar CSV
        </button>
      </AdminPageHeader>
      {entries.length === 0 ? (
        <EmptySkeleton icon={ListChecks} variant="rows" rows={4} title="Nadie en la lista de espera" text="Cada persona que se apunte aparecerá aquí con su correo, perfil y fecha, lista para exportar en CSV." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e7eaee] bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-[#e7eaee] bg-[#f8f9fb] text-xs text-[#667085]">
              <tr>
                {columns.map((column) => {
                  const active = sort.key === column.key;
                  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th key={column.key} scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-2.5 font-medium">
                      <button type="button" onClick={() => toggle(column.key)} className={`inline-flex items-center gap-1 hover:text-[#1c2740] ${active ? "text-[#1c2740]" : ""}`}>
                        {column.label}
                        <Icon className="size-3.5" aria-hidden />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {visible.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#f8f9fb]">
                  <td className="px-4 py-3 font-medium text-[#1c2740]">{entry.name}</td>
                  <td className="px-4 py-3">
                    <a className="text-[#0f6e73] underline-offset-4 hover:underline" href={`mailto:${entry.email}`}>{entry.email}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-xs font-medium text-[#465ab4]">{entry.roleLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-[#3d4a63]">{entry.city || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#667085] tabular-nums">{formatWhen(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="px-4 py-6 text-sm text-[#667085]">Ningún registro coincide con la búsqueda.</p> : null}
        </div>
      )}
    </div>
  );
}
