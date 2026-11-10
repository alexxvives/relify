"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import type { AdminActionState } from "@/app/(app)/admin/actions";
import { updateValuationRequestAction } from "@/app/(app)/admin/valoraciones/actions";
import { NewPill } from "@/components/admin-new";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { EmptySkeleton } from "@/components/ui/empty-skeleton";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  isValuationRequestStatus,
  valuationCopy,
  valuationRequestStatuses,
  type ValuationRequestStatus,
} from "@/lib/valuation-request";
import type { AdminValuationRow } from "@/server/listValuationRequests";

type StatusFilter = "all" | ValuationRequestStatus;

const when = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

const statusTone: Record<ValuationRequestStatus, string> = {
  received: "bg-[#fff4d6] text-[#8a6112]",
  sabi_loaded: "bg-[#e6f4f2] text-[#0f6b62]",
  drafted: "bg-[#eef2ff] text-[#465ab4]",
  sent: "bg-[#e8f6ee] text-[#17663a]",
  discarded: "bg-[#f4f5f7] text-[#667085]",
};

function formatWhen(iso: string): string {
  return when.format(new Date(iso));
}

function isStatusFilter(value: string): value is StatusFilter {
  return value === "all" || isValuationRequestStatus(value);
}

const SAVE_NOTICE_MS = 3000;

function RowForm({ row }: { row: AdminValuationRow }) {
  const [state, action, pending] = useActionState(updateValuationRequestAction, null);
  const [seen, setSeen] = useState<AdminActionState>(null);
  const [hidden, setHidden] = useState(false);

  if (state !== seen) {
    setSeen(state);
    setHidden(false);
  }

  useEffect(() => {
    if (!state?.ok) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHidden(true);
    }, SAVE_NOTICE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state]);

  const notice = hidden ? null : state;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={row.id} />
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-[#667085]">
        {valuationCopy.adminStatus}
        <select
          name="status"
          defaultValue={row.status}
          className="h-11 min-w-0 rounded-full border border-[#e7eaee] bg-white px-3 text-sm text-[#1c2740] outline-none focus-visible:border-[#1c2740]"
        >
          {valuationRequestStatuses.map((status) => (
            <option key={status} value={status}>
              {valuationCopy.status[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-[#667085]">
        {valuationCopy.adminNotes}
        <textarea
          name="notes"
          defaultValue={row.notes}
          rows={2}
          maxLength={4000}
          className="min-h-20 w-full resize-y rounded-2xl border border-[#e7eaee] bg-white px-3 py-2 text-sm text-[#1c2740] outline-none focus-visible:border-[#1c2740]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[#1c2740] px-4 text-sm font-medium text-white hover:bg-[#2a3a5c] disabled:opacity-60"
        >
          {pending ? valuationCopy.adminSaving : valuationCopy.adminSave}
        </button>
        {notice ? (
          <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "text-sm text-[#17663a]" : "text-sm text-[#b42318]"}>
            {notice.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function AdminValoraciones({ entries }: { entries: AdminValuationRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const needle = query.trim().toLocaleLowerCase("es");

  const visible = useMemo(() => {
    return entries.filter((entry) => {
      if (status !== "all" && entry.status !== status) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      const haystack = `${entry.cif} ${entry.contactName} ${entry.contactEmail} ${entry.phone}`.toLocaleLowerCase("es");
      return haystack.includes(needle);
    });
  }, [entries, needle, status]);

  const counts = useMemo(() => {
    const byStatus = new Map<string, number>();
    for (const entry of entries) {
      byStatus.set(entry.statusLabel, (byStatus.get(entry.statusLabel) ?? 0) + 1);
    }
    return [...byStatus.entries()];
  }, [entries]);

  return (
    <div>
      <AdminPageHeader
        title={valuationCopy.adminTitle}
        note={
          entries.length === 0
            ? valuationCopy.adminNoteEmpty
            : `${entries.length} ${entries.length === 1 ? "solicitud" : "solicitudes"}${counts.length ? ` · ${counts.map(([label, n]) => `${label} ${n}`).join(" · ")}` : ""}`
        }
      >
        {entries.length > 0 ? (
          <>
            <AdminSearchField
              id="admin-valuation-search"
              label="Buscar"
              value={query}
              placeholder={valuationCopy.adminSearch}
              onChange={setQuery}
            />
            <div className="min-w-0 sm:w-52">
              <FilterSelect
                label={valuationCopy.adminStatus}
                value={status}
                options={[
                  { value: "all", label: valuationCopy.statusAll },
                  ...valuationRequestStatuses.map((value) => ({ value, label: valuationCopy.status[value] })),
                ]}
                onValueChange={(next) => {
                  if (isStatusFilter(next)) {
                    setStatus(next);
                  }
                }}
              />
            </div>
          </>
        ) : null}
      </AdminPageHeader>
      {entries.length === 0 ? (
        <EmptySkeleton
          icon={LineChart}
          variant="rows"
          rows={4}
          title={valuationCopy.adminEmptyTitle}
          text={valuationCopy.adminEmptyText}
        />
      ) : visible.length === 0 ? (
        <p className="text-sm text-[#667085]">Ninguna solicitud coincide con el filtro.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-[#e7eaee] bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold tracking-wide text-[#1c2740]">{entry.cif}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[entry.status]}`}>
                      {entry.statusLabel}
                    </span>
                    {entry.isNew ? <NewPill /> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#1c2740]">{entry.contactName}</p>
                  <a
                    className="mt-0.5 inline-flex min-h-11 items-center text-sm text-[#0f6e73] underline-offset-4 hover:underline"
                    href={`mailto:${entry.contactEmail}`}
                  >
                    {entry.contactEmail}
                  </a>
                  <dl className="mt-2 grid gap-1 text-sm text-[#5c6b78]">
                    <div className="flex flex-wrap gap-x-2">
                      <dt>{valuationCopy.adminPhone}</dt>
                      <dd>{entry.phone || "—"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt>{valuationCopy.adminAccount}</dt>
                      <dd>{entry.linkedAccount ? "Vinculada" : "Visitante"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt>{valuationCopy.adminWhen}</dt>
                      <dd className="tabular-nums">{formatWhen(entry.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                <RowForm key={entry.id} row={entry} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
