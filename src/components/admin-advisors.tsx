"use client";

import { useState } from "react";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import type { AdvisorScoreBreakdown } from "@/lib/advisor-directory";
import type { AdminAdvisorRow } from "@/server/listAdminAdvisors";

const scoreFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

type RankFilter = "all" | "ranked" | "out";

function isRankFilter(value: string): value is RankFilter {
  return value === "all" || value === "ranked" || value === "out";
}

function scoreText(value: number): string {
  return scoreFormat.format(value);
}

export function AdminAdvisors({ advisors }: { advisors: AdminAdvisorRow[] }) {
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState<RankFilter>("all");
  const needle = query.trim().toLocaleLowerCase("es");
  const visible = advisors.filter((advisor) => {
    if (rank === "ranked" && advisor.place === null) {
      return false;
    }

    if (rank === "out" && advisor.place !== null) {
      return false;
    }

    if (needle.length === 0) {
      return true;
    }

    return `${advisor.name} ${advisor.email} ${advisor.businessName} ${advisor.sectors.join(" ")}`.toLocaleLowerCase("es").includes(needle);
  });

  return (
    <div>
      <AdminPageHeader title={adminCopy.advisorsTitle} note={adminCopy.advisorsIntro}>
        <AdminSearchField
          id="admin-advisor-search"
          label={adminCopy.searchLabel}
          value={query}
          placeholder={adminCopy.searchAccounts}
          onChange={setQuery}
        />
        <div className="w-44">
          <FilterSelect
            compact
            label={adminCopy.rankFilter}
            value={rank}
            options={[
              { value: "all", label: adminCopy.rankAll },
              { value: "ranked", label: adminCopy.rankIn },
              { value: "out", label: adminCopy.rankOut },
            ]}
            onValueChange={(next) => {
              if (isRankFilter(next)) {
                setRank(next);
              }
            }}
          />
        </div>
      </AdminPageHeader>
      {visible.length === 0 ? (
        <p className="text-sm text-[#667085]">{advisors.length === 0 ? adminCopy.advisorsEmpty : adminCopy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((advisor) => (
            <li key={advisor.id} className="rounded-2xl border border-[#e7eaee] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-[#1c2740]">{advisor.name}</p>
                  <p className="mt-1 text-sm text-[#667085]">{advisor.email}</p>
                  <p className="mt-1 text-sm text-[#3d4a63]">
                    {adminCopy.advisorBusiness}: {advisor.businessName.length > 0 ? advisor.businessName : adminCopy.identityEmpty}
                  </p>
                </div>
                <p className="rounded-full bg-[#e8f6ee] px-3 py-1 text-sm font-semibold text-[#17663a]">
                  {advisor.place === null
                    ? adminCopy.advisorUnranked
                    : `${adminCopy.advisorPlace} ${advisor.place} de ${advisor.total}`}
                </p>
              </div>
              {advisor.sectors.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {advisor.sectors.map((sector) => (
                    <li key={sector} className="rounded-full bg-[#f4f7ff] px-3 py-1 text-xs text-[#1c2740]">
                      {sector}
                    </li>
                  ))}
                </ul>
              ) : null}
              {advisor.breakdown ? <AdvisorScores breakdown={advisor.breakdown} /> : null}
              <p className="mt-3 text-sm leading-6 text-[#1c2740]">{advisor.justification}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdvisorScores({ breakdown }: { breakdown: AdvisorScoreBreakdown }) {
  const rows = [
    { label: adminCopy.advisorCases, value: String(breakdown.caseCount) },
    { label: adminCopy.advisorServices, value: String(breakdown.serviceCount) },
    { label: adminCopy.advisorQuality, value: scoreText(breakdown.quality) },
    { label: adminCopy.advisorReliability, value: scoreText(breakdown.reliability) },
  ];

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 rounded-xl bg-[#f4f7ff] px-3 py-2">
          <dt className="text-sm text-[#3d4a63]">{row.label}</dt>
          <dd className="text-sm font-semibold text-[#1c2740] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
