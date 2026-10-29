"use client";

import { formatDecimal } from "@/lib/money";
import { useState } from "react";
import { VerifiedToggle } from "@/components/admin-controls";
import { AdminPageHeader, AdminSearchField } from "@/components/admin-toolbar";
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
              <div className="flex items-start justify-between gap-2 px-1">
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
                  {advisor.breakdown ? <ScorePopover breakdown={advisor.breakdown} /> : null}
                </div>
                <VerifiedToggle compact target="advisor" id={advisor.id} verified={advisor.verified} />
              </div>
              {advisor.card ? (
                <AdvisorListingCard advisor={advisor.card} natural />
              ) : (
                <div className="rounded-2xl border border-dashed border-[#c5ced8] bg-white p-5">
                  <p className="text-lg font-semibold text-[#1c2740]">{advisorHeading(advisor)}</p>
                  <p className="mt-2 text-sm text-[#667085]">{advisor.justification}</p>
                </div>
              )}
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

function ScorePopover({ breakdown }: { breakdown: AdvisorScoreBreakdown }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-full border border-[#c5ced8] bg-white px-3 py-1 text-sm font-medium text-[#465ab4] hover:border-[#465ab4]">
        Ver score
      </summary>
      <div className="absolute left-0 z-20 mt-2 w-[22rem] max-w-[80vw] rounded-2xl border border-[#e7eaee] bg-white p-4 shadow-[0_18px_40px_-18px_rgba(28,39,64,0.45)]">
        <AdvisorScores breakdown={breakdown} />
        <details className="mt-3 text-xs"><summary className="cursor-pointer text-[#465ab4]">Cómo se calcula</summary><p className="mt-2 leading-5 text-[#667085] whitespace-pre-line">{adminCopy.rankRules}</p></details>
      </div>
    </details>
  );
}

const scoreParts = [
  { key: "cases", label: "Casos cerrados", max: 64, color: "#1c2740" },
  { key: "services", label: "Servicios", max: 20, color: "#465ab4" },
  { key: "description", label: "Descripción", max: 12, color: "#0f8a7a" },
  { key: "sectors", label: "Sectores", max: 8, color: "#7fb8b0" },
] as const;

function AdvisorScores({ breakdown }: { breakdown: AdvisorScoreBreakdown }) {
  const qualityMax = scoreParts.reduce((sum, part) => sum + part.max, 0);
  const details: Record<(typeof scoreParts)[number]["key"], string> = {
    cases: `${breakdown.caseCount} (máx. 4)`,
    services: `${breakdown.serviceCount} (máx. 4)`,
    description: `${breakdown.descriptionLength} caracteres`,
    sectors: `${breakdown.sectorCount}`,
  };
  const leaks = [
    breakdown.email ? "Correo −30" : "",
    breakdown.phone ? "Teléfono −30" : "",
    breakdown.offPlatform ? "Contacto fuera −25" : "",
  ].filter((item) => item.length > 0);

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-[#667085]">Ranking</p>
          <p className="text-3xl font-semibold tracking-tight text-[#1c2740] tabular-nums">{scoreText(breakdown.rank)}</p>
        </div>
        <p className="text-right text-xs leading-5 text-[#667085]">
          Nota {scoreText(breakdown.quality)} × fiabilidad {scoreText(breakdown.reliability)} %
        </p>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-[#1c2740]">{adminCopy.advisorQuality}</span>
          <span className="tabular-nums text-[#667085]">{scoreText(breakdown.quality)} / {qualityMax}</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-[#eef1f5]" role="img" aria-label={`${adminCopy.advisorQuality} ${scoreText(breakdown.quality)} de ${qualityMax}`}>
          {scoreParts.map((part) => (
            <span key={part.key} style={{ width: `${(breakdown[part.key] / qualityMax) * 100}%`, background: part.color }} />
          ))}
        </div>
        <ul className="mt-3 grid gap-2">
          {scoreParts.map((part) => (
            <li key={part.key} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-[#3d4a63]">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: part.color }} />
                {part.label}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-[#eef1f5]" title={details[part.key]}>
                <span className="block h-full rounded-full" style={{ width: `${(breakdown[part.key] / part.max) * 100}%`, background: part.color }} />
              </span>
              <span className="text-right tabular-nums text-[#1c2740]">{scoreText(breakdown[part.key])}/{part.max}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-[#1c2740]">{adminCopy.advisorReliability}</span>
          <span className="tabular-nums text-[#667085]">{scoreText(breakdown.reliability)} / 100</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#eef1f5]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, breakdown.reliability))}%`, background: breakdown.reliability >= 100 ? "#0f8a7a" : "#c0362c" }}
          />
        </div>
        {leaks.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {leaks.map((leak) => (
              <span key={leak} className="rounded-full bg-[#fdeeee] px-2 py-0.5 text-[11px] font-medium text-[#8d2424]">{leak}</span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
