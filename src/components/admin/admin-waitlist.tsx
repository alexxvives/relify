"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Briefcase, Building2, Download, Handshake, ListChecks, type LucideIcon } from "lucide-react";
import { waitlistCopy, waitlistRoles } from "@/lib/waitlist";
import { deleteWaitlistAction } from "@/app/(app)/admin/lista-de-espera/actions";
import { NewPill } from "@/components/admin/admin-new";
import { AdminPageHeader, AdminSearchField } from "@/components/admin/admin-toolbar";
import { EmptySkeleton } from "@/components/ui/empty-skeleton";
import { waitlistCsv } from "@/lib/waitlist-csv";
import type { AdminWaitlistRow } from "@/lib/server/list-waitlist";

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

const roleTone = {
  company: {
    chip: "bg-[#0c7c78]",
    pill: "bg-[#e6f4f3] text-[#0b5559]",
    ink: "text-[#0b5559]",
    bg: "bg-[#e6f4f3]",
    ring: "ring-[#0c7c78]/15",
    icon: Building2,
  },
  investor: {
    chip: "bg-[#465ab4]",
    pill: "bg-[#eef1fb] text-[#2f3f8f]",
    ink: "text-[#2f3f8f]",
    bg: "bg-[#eef1fb]",
    ring: "ring-[#465ab4]/15",
    icon: Briefcase,
  },
  advisor: {
    chip: "bg-[#e3a008]",
    pill: "bg-[#fdf4e3] text-[#b26b00]",
    ink: "text-[#b26b00]",
    bg: "bg-[#fdf4e3]",
    ring: "ring-[#e3a008]/20",
    icon: Handshake,
  },
} satisfies Record<(typeof waitlistRoles)[number], { chip: string; pill: string; ink: string; bg: string; ring: string; icon: LucideIcon }>;

const totalTone = {
  chip: "bg-[#1c2740]",
  ink: "text-[#1c2740]",
  bg: "bg-[#f4f6fb]",
  ring: "ring-[#1c2740]/10",
  icon: ListChecks,
};

function WaitlistStats({ total, byRole }: { total: number; byRole: Map<string, number> }) {
  const cards = [
    { key: "total", label: total === 1 ? "Registro" : "Registros", value: total, ...totalTone },
    ...waitlistCopy.roles.map((role) => ({
      key: role.id,
      label: role.label,
      value: byRole.get(role.id) ?? 0,
      ...roleTone[role.id],
    })),
  ];

  return (
    <ul className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <li key={card.key} className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-4 ring-1 ${card.bg} ${card.ring}`}>
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${card.chip}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className={`block text-2xl leading-7 font-semibold tabular-nums ${card.ink}`}>{card.value}</span>
              <span className="block text-xs leading-4 text-[#3d4a63]">{card.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function formatWhen(iso: string): string {
  return when.format(new Date(iso));
}

function DeleteEntry({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteWaitlistAction, null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`¿Quitar a ${name} de la lista de espera?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[#f1d4d1] bg-white px-4 text-sm font-semibold text-[#c0362c] hover:bg-[#fdecec] disabled:opacity-60 md:h-8 md:px-3 md:text-xs"
      >
        {pending ? "Borrando…" : "Borrar"}
      </button>
      {state && !state.ok ? (
        <p role="alert" className="mt-1 text-xs text-[#b42318]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
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

  const byRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.role, (counts.get(entry.role) ?? 0) + 1);
    return counts;
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
      <AdminPageHeader title="Lista de espera">
        <AdminSearchField id="admin-waitlist-search" label="Buscar" value={query} placeholder="Nombre, correo o ciudad" onChange={setQuery} />
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white hover:bg-[#2a3a5c] disabled:opacity-50 lg:h-9"
        >
          <Download className="size-4" aria-hidden />
          Exportar CSV
        </button>
      </AdminPageHeader>
      <WaitlistStats total={entries.length} byRole={byRole} />
      {entries.length === 0 ? (
        <EmptySkeleton icon={ListChecks} variant="rows" rows={4} title="Nadie en la lista de espera" text="Cada persona que se apunte aparecerá aquí con su correo, perfil y fecha, lista para exportar en CSV." />
      ) : (
        <>
        <ul className="grid gap-3 md:hidden">
          {visible.map((entry) => {
            const tone = entry.role in roleTone ? roleTone[entry.role as keyof typeof roleTone] : null;
            return (
              <li key={entry.id} className="rounded-2xl border border-[#e7eaee] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 font-semibold text-[#1c2740]">
                      <span className="truncate">{entry.name}</span>
                      {entry.isNew ? <NewPill /> : null}
                    </p>
                    <a className="mt-0.5 block truncate text-sm text-[#0f6e73]" href={`mailto:${entry.email}`}>
                      {entry.email}
                    </a>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone ? tone.pill : "bg-[#eef2ff] text-[#465ab4]"}`}>
                    {entry.roleLabel}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#667085]">
                  <div>
                    <dt>Ciudad</dt>
                    <dd className="mt-0.5 text-sm font-medium text-[#1c2740]">{entry.city || "—"}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd className="mt-0.5 text-sm font-medium text-[#1c2740] tabular-nums">{formatWhen(entry.createdAt)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <DeleteEntry id={entry.id} name={entry.name} />
                </div>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 ? <p className="px-1 py-4 text-sm text-[#667085] md:hidden">Ningún registro coincide con la búsqueda.</p> : null}
        <div className="hidden overflow-x-auto rounded-2xl border border-[#e7eaee] bg-white md:block">
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
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {visible.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#f8f9fb]">
                  <td className="px-4 py-3 font-medium text-[#1c2740]">
                    <span className="inline-flex items-center gap-2">
                      {entry.name}
                      {entry.isNew ? <NewPill /> : null}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a className="text-[#0f6e73] underline-offset-4 hover:underline" href={`mailto:${entry.email}`}>{entry.email}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.role in roleTone ? roleTone[entry.role as keyof typeof roleTone].pill : "bg-[#eef2ff] text-[#465ab4]"}`}>{entry.roleLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-[#3d4a63]">{entry.city || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#667085] tabular-nums">{formatWhen(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteEntry id={entry.id} name={entry.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="px-4 py-6 text-sm text-[#667085]">Ningún registro coincide con la búsqueda.</p> : null}
        </div>
        </>
      )}
    </div>
  );
}
