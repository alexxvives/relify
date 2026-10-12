"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DealPipeline, DealWaitingCue } from "@/components/deal-pipeline";
import { AdminPageHeader } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { watchingCue } from "@/lib/deal-pipeline";
import type { AdminConnectionRow } from "@/server/listAdminConnections";

type ProcessFilter = "active" | "closed" | "waiting" | "all";

function isProcessFilter(value: string): value is ProcessFilter {
  return value === "active" || value === "closed" || value === "waiting" || value === "all";
}

function matches(connection: AdminConnectionRow, filter: ProcessFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "waiting") {
    return !connection.accepted;
  }

  if (filter === "closed") {
    return connection.accepted && connection.closed;
  }

  return connection.accepted && !connection.closed;
}

export function AdminConnections({ connections }: { connections: AdminConnectionRow[] }) {
  const [filter, setFilter] = useState<ProcessFilter>("active");
  const visible = connections.filter((connection) => matches(connection, filter));

  return (
    <div>
      <AdminPageHeader title={adminCopy.connectionsTitle} note={adminCopy.activeIntro}>
        <div className="w-40">
          <FilterSelect
            compact
            label={adminCopy.processFilter}
            value={filter}
            options={[
              { value: "active", label: adminCopy.processActive },
              { value: "waiting", label: adminCopy.processWaiting },
              { value: "closed", label: adminCopy.processClosed },
              { value: "all", label: adminCopy.processAll },
            ]}
            onValueChange={(next) => {
              if (isProcessFilter(next)) {
                setFilter(next);
              }
            }}
          />
        </div>
      </AdminPageHeader>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{filter === "active" ? adminCopy.processEmptyActive : adminCopy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((connection) => (
            <li key={connection.id} className="rounded-2xl border border-[#e7eaee] bg-white p-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#1c2740]">{connection.codename}</h2>
                  <p className="mt-1 text-sm text-[#667085]">{connection.region}</p>
                </div>
                <DealWaitingCue cue={{ action: watchingCue(connection.steps) }} />
                <Link
                  href={`/admin/conexiones/${connection.id}`}
                  className="ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
                >
                  {adminCopy.openCompany}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              {connection.steps.length > 0 ? (
                <div className="mt-2">
                  <DealPipeline steps={connection.steps} role="advisor" hideAsideCue />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
