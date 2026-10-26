"use client";

import { formatDecimal } from "@/lib/money";
import { useState } from "react";
import { VerifiedToggle } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
import { VerifiedBadge } from "@/components/project-photo";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import { FilterSelect } from "@/components/ui/filter-select";
import { adminCopy } from "@/lib/admin-copy";
import { advisorSectorName } from "@/lib/advisor-sectors";
import type { AdvisorScoreBreakdown } from "@/lib/advisor-directory";
import type { AdminAdvisorRow } from "@/server/listAdminAdvisors";
import { NewPill, adminNewRing } from "@/components/admin-new";


type RankFilter = "all" | "ranked" | "out";

function isRankFilter(value: string): value is RankFilter {
  return value === "all" || value === "ranked" || value === "out";
}

function scoreText(value: number): string {
  return formatDecimal(value);
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
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((advisor) => (
            <li
              key={advisor.id}
              className={`flex flex-col gap-3 rounded-2xl border p-3 ${advisor.isNew ? adminNewRing : "border-[#e7eaee] bg-[#f8f9fb]"}`}
            >
              {advisor.card ? (
                <AdvisorListingCard advisor={advisor.card} natural />
              ) : (
                <div className="rounded-2xl border border-dashed border-[#c5ced8] bg-white p-5">
                  <p className="text-lg font-semibold text-[#1c2740]">{advisorHeading(advisor)}</p>
                  <p className="mt-2 text-sm text-[#667085]">{advisor.justification}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 px-1">
                <div className="flex flex-wrap items-center gap-2">
                  {advisor.isNew ? <NewPill /> : null}
                  <p className="rounded-full bg-[#e8f6ee] px-3 py-1 text-sm font-semibold text-[#17663a]">
                    {advisor.place === null
                      ? adminCopy.advisorUnranked
                      : `${adminCopy.advisorPlace} ${advisor.place} de ${advisor.total}`}
                  </p>
                  {advisor.breakdown ? (
                    <p className="text-sm font-semibold text-[#1c2740] tabular-nums">
                      Score {scoreText(advisor.breakdown.rank)}
                    </p>
                  ) : null}
                  {advisor.breakdown ? <ScorePopover advisor={advisor} breakdown={advisor.breakdown} /> : null}
                </div>
                <p className="truncate text-sm text-[#667085]">
                  {advisorHeading(advisor)} · {advisor.email}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {advisor.verified ? <VerifiedBadge /> : null}
                  <VerifiedToggle target="advisor" id={advisor.id} verified={advisor.verified} />
                </div>
              </div>
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

function ScorePopover({ advisor, breakdown }: { advisor: AdminAdvisorRow; breakdown: AdvisorScoreBreakdown }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-full border border-[#c5ced8] bg-white px-3 py-1 text-sm font-medium text-[#465ab4] hover:border-[#465ab4]">
        Ver score
      </summary>
      <div className="absolute left-0 z-20 mt-2 w-[22rem] max-w-[80vw] rounded-2xl border border-[#e7eaee] bg-white p-4 shadow-[0_18px_40px_-18px_rgba(28,39,64,0.45)]">
        <AdvisorScores breakdown={breakdown} />
        <p className="mt-3 text-xs leading-5 text-[#3d4a63]">{advisor.justification}</p>
        <p className="mt-2 text-xs leading-5 text-[#667085] whitespace-pre-line">{adminCopy.rankRules}</p>
      </div>
    </details>
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
    <dl className="grid grid-cols-2 gap-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl bg-[#f4f7ff] px-3 py-2">
          <dt className="text-xs text-[#3d4a63]">{row.label}</dt>
          <dd className="text-lg font-semibold tracking-tight text-[#1c2740] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
