"use client";

import { useState } from "react";
import { VerifiedToggle } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { VerifiedBadge } from "@/components/project-photo";
import { FieldHint } from "@/components/field-hint";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { advisorSectorName } from "@/lib/advisor-sectors";
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

    const sectors = advisor.sectors.map((sector) => `${sector} ${advisorSectorName(sector)}`).join(" ");
    return `${advisor.name} ${advisor.email} ${advisor.businessName} ${sectors}`.toLocaleLowerCase("es").includes(needle);
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
            <li
              key={advisor.id}
              className={
                advisor.breakdown
                  ? "flex flex-col gap-3 rounded-2xl border border-[#e7eaee] bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                  : "rounded-2xl border border-[#e7eaee] bg-white p-4"
              }
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-[#1c2740]">{advisorHeading(advisor)}</p>
                  <p className="rounded-full bg-[#e8f6ee] px-3 py-1 text-sm font-semibold text-[#17663a]">
                    {advisor.place === null
                      ? adminCopy.advisorUnranked
                      : `${adminCopy.advisorPlace} ${advisor.place} de ${advisor.total}`}
                  </p>
                  <FieldHint
                    wide
                    align="start"
                    text={advisor.place === null ? adminCopy.rankRules : `${adminCopy.rankRules}\n\n${advisor.justification}`}
                  />
                </div>
                <p className="mt-1 text-sm text-[#667085]">{advisor.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {advisor.verified ? <VerifiedBadge /> : null}
                  <VerifiedToggle target="advisor" id={advisor.id} verified={advisor.verified} />
                </div>
                {advisor.sectors.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {advisor.sectors.map((sector) => (
                      <li key={sector} className="rounded-full bg-[#f4f7ff] px-3 py-1 text-xs text-[#1c2740]">
                        {advisorSectorName(sector)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {advisor.place === null ? <p className="mt-3 text-sm text-[#667085]">{advisor.justification}</p> : null}
              </div>
              {advisor.breakdown ? <AdvisorScores breakdown={advisor.breakdown} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function advisorHeading(advisor: AdminAdvisorRow): string {
  const business = advisor.businessName.trim();
  const person = advisor.name.trim();

  if (business.length > 0 && person.length > 0) {
    return `${business} (${person})`;
  }

  return business.length > 0 ? business : person;
}

function AdvisorScores({ breakdown }: { breakdown: AdvisorScoreBreakdown }) {
  const rows = [
    { label: adminCopy.advisorCases, value: String(breakdown.caseCount) },
    { label: adminCopy.advisorServices, value: String(breakdown.serviceCount) },
    { label: adminCopy.advisorQuality, value: scoreText(breakdown.quality) },
    { label: adminCopy.advisorReliability, value: scoreText(breakdown.reliability) },
  ];

  return (
    <dl className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[28rem]">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl bg-[#f4f7ff] px-3 py-2">
          <dt className="text-xs text-[#3d4a63]">{row.label}</dt>
          <dd className="text-lg font-semibold tracking-tight text-[#1c2740] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
