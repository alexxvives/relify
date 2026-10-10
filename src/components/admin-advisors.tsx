import { adminCopy } from "@/lib/admin-copy";
import type { AdvisorScoreBreakdown } from "@/lib/advisor-directory";
import type { AdminAdvisorRow } from "@/server/listAdminAdvisors";

const scoreFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function scoreText(value: number): string {
  return scoreFormat.format(value);
}

export function AdminAdvisors({ advisors }: { advisors: AdminAdvisorRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#667085]">{adminCopy.advisorsIntro}</p>
      {advisors.length === 0 ? (
        <p className="text-sm text-[#667085]">{adminCopy.advisorsEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {advisors.map((advisor) => (
            <li key={advisor.id} className="rounded-2xl border border-[#e7eaee] bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#1c2740]">{advisor.name}</p>
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
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 rounded-lg bg-[#f4f7ff] px-3 py-2">
          <dt className="text-sm text-[#3d4a63]">{row.label}</dt>
          <dd className="text-sm font-semibold text-[#1c2740] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
