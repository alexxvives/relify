"use client";

import { useState } from "react";
import { DealPipeline, DealWaitingCue } from "@/components/investor/deal-pipeline";
import { ProcessFichaLink } from "@/components/investor/process-ficha-link";
import { AdminPageHeader } from "@/components/admin/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { watchingCue } from "@/lib/deal-pipeline";
import { formatEur } from "@/lib/money";
import type { AdminConnectionRow } from "@/lib/server/list-admin-connections";
import { NewPill, adminNewRing } from "@/components/admin/admin-new";

type ProcessFilter = "active" | "closed" | "sold" | "waiting" | "all";

function isProcessFilter(value: string): value is ProcessFilter {
  return value === "active" || value === "closed" || value === "sold" || value === "waiting" || value === "all";
}

function matches(connection: AdminConnectionRow, filter: ProcessFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "waiting") {
    return !connection.accepted;
  }

  if (filter === "sold") {
    return connection.soldPriceCents !== null;
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
        <div className="w-52">
          <FilterSelect
            compact
            label={adminCopy.processFilter}
            value={filter}
            options={[
              { value: "active", label: adminCopy.processActive },
              { value: "waiting", label: adminCopy.processWaiting },
              { value: "closed", label: adminCopy.processClosed },
              { value: "sold", label: `${adminCopy.processSold} (${connections.filter((c) => c.soldPriceCents !== null).length})` },
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
            <li key={connection.id} className={`rounded-2xl border p-5 ${connection.isNew ? adminNewRing : "border-[#e7eaee] bg-white"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1c2740]">
                    {connection.codename}
                    {connection.isNew ? <NewPill /> : null}
                  </h2>
                  {connection.soldPriceCents !== null ? (
                    <p className="mt-1 text-sm font-semibold text-[#0d5c38]">
                      {adminCopy.soldPrice}: {formatEur(connection.soldPriceCents)}
                    </p>
                  ) : null}
                </div>
                <DealWaitingCue cue={{ action: watchingCue(connection.steps) }} />
                </div>
                <ProcessFichaLink href={`/admin/conexiones/${connection.id}`} />
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
