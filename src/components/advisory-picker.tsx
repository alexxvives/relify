"use client";

import { useActionState, useState } from "react";
import { Briefcase, Calculator, Check, FileSpreadsheet, Scale, Search, Users } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/asesoramiento/actions";
import { advisoryCopy, advisoryServices, type AdvisoryServiceId } from "@/lib/advisory";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

const serviceStyle = {
  "due-diligence": { icon: Search, wash: "bg-[#eef2ff] text-[#465ab4]", fill: "bg-[#e4ebff]", mark: "bg-[#465ab4]" },
  valuation: { icon: Calculator, wash: "bg-[#e8f6ee] text-[#17663a]", fill: "bg-[#dff6e8]", mark: "bg-[#17663a]" },
  legal: { icon: Scale, wash: "bg-[#f3f1ff] text-[#5b4db8]", fill: "bg-[#ece8ff]", mark: "bg-[#5b4db8]" },
  tax: { icon: FileSpreadsheet, wash: "bg-[#fff6e8] text-[#8a6112]", fill: "bg-[#fff1d9]", mark: "bg-[#8a6112]" },
  "business-plan": { icon: Briefcase, wash: "bg-[#e7f6f6] text-[#0f6e73]", fill: "bg-[#d9f3f3]", mark: "bg-[#0f6e73]" },
  labor: { icon: Users, wash: "bg-[#fdeeee] text-[#9b3b2f]", fill: "bg-[#fce4e4]", mark: "bg-[#9b3b2f]" },
} as const;

const offerTitle: Record<AdvisoryServiceId, string> = {
  "due-diligence": "Due Diligence",
  valuation: "Valoración de empresas",
  legal: "Consultoría legal",
  tax: "Consultoría fiscal",
  "business-plan": "Business Plan",
  labor: "Consultoría laboral",
};

export function AdvisoryPicker({
  layout = "list",
  advisors = [],
  projectSlug,
  companies = [],
}: {
  layout?: "list" | "cards";
  advisors?: PublicAdvisorCard[];
  projectSlug?: string;
  companies?: { slug: string; codename: string; region: string }[];
}) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [selected, setSelected] = useState<AdvisoryServiceId[]>([]);
  const [advisorId, setAdvisorId] = useState("");
  const cards = layout === "cards";
  const visibleAdvisors =
    selected.length === 0
      ? advisors
      : advisors.filter((advisor) => selected.every((id) => advisor.services.some((service) => service.title === offerTitle[id])));
  const chosen = visibleAdvisors.some((advisor) => advisor.id === advisorId) ? advisorId : "";

  function toggle(id: AdvisoryServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {selected.map((id) => (
        <input key={id} type="hidden" name="services" value={id} />
      ))}
      {projectSlug ? <input type="hidden" name="projectSlug" value={projectSlug} /> : null}
      <input type="hidden" name="advisorId" value={chosen} />
      {companies.length > 0 ? (
        <label className="text-sm font-medium text-[#1c2740]">
          {engagementCopy.pickCompany}
          <select name="projectSlug" required className="mt-1 h-11 w-full rounded-xl border border-[#d5dbe3] bg-white px-3">
            <option value="">{engagementCopy.companyRequired}</option>
            {companies.map((company) => (
              <option key={company.slug} value={company.slug}>
                {company.codename} · {company.region}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <ul className={cards ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
        {advisoryServices.map((service) => {
          const style = serviceStyle[service.id];
          const Icon = style.icon;
          const active = selected.includes(service.id);
          const frame = cards ? "flex h-full cursor-pointer flex-col rounded-2xl border p-5" : "flex cursor-pointer gap-4 rounded-2xl border p-4";
          return (
            <li key={service.id}>
              <label className={active ? `${frame} border-transparent ${style.fill}` : `${frame} border-[#e7eaee] bg-white`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => {
                    toggle(service.id);
                  }}
                />
                <span className={cards ? "flex items-start justify-between gap-3" : "contents"}>
                  <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${style.wash}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span
                    className={
                      active
                        ? `inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white ${style.mark}`
                        : "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[#d5dbe3] bg-white"
                    }
                    aria-hidden
                  >
                    {active ? <Check className="size-3.5" /> : null}
                  </span>
                </span>
                <span className={cards ? "mt-4" : undefined}>
                  <span className="block text-base font-semibold text-[#1c2740]">{service.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#5c6b78]">{service.body}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <AdvisorMarket advisors={visibleAdvisors} chosen={chosen} onChoose={setAdvisorId} />
      {state ? (
        <p role="status" className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <div className={cards ? "mt-2 flex items-center justify-end gap-4" : "flex flex-wrap items-center justify-between gap-3"}>
        <button
          type="button"
          onClick={() => {
            setSelected([]);
          }}
          className="text-sm font-medium text-[#3d4a63] hover:text-[#465ab4]"
        >
          {advisoryCopy.clear}
        </button>
        <button
          type="submit"
          disabled={pending || selected.length === 0 || chosen.length === 0}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
        >
          {pending ? advisoryCopy.pending : advisoryCopy.submit}
        </button>
      </div>
      {selected.length > 0 && chosen.length === 0 ? <p className="text-sm text-[#5c6b78]">{engagementCopy.chooseAdvisor}</p> : null}
    </form>
  );
}

function AdvisorMarket({
  advisors,
  chosen,
  onChoose,
}: {
  advisors: PublicAdvisorCard[];
  chosen: string;
  onChoose: (id: string) => void;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[#1c2740]">{engagementCopy.marketplaceTitle}</h3>
      <p className="mt-1 text-sm text-[#5c6b78]">{engagementCopy.marketplaceHint}</p>
      {advisors.length === 0 ? <p className="mt-3 text-sm text-[#5c6b78]">{engagementCopy.marketplaceEmpty}</p> : null}
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {advisors.map((advisor) => {
          const active = advisor.id === chosen;
          return (
            <li key={advisor.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onChoose(advisor.id);
                }}
                className={
                  active
                    ? "flex h-full w-full flex-col rounded-2xl border border-[#465ab4] bg-[#f4f6ff] p-4 text-left"
                    : "flex h-full w-full flex-col rounded-2xl border border-[#e7eaee] bg-white p-4 text-left"
                }
              >
                <span className="text-base font-semibold text-[#1c2740]">{advisor.businessName}</span>
                <span className="mt-1 text-sm text-[#5c6b78]">{advisor.sectors.join(", ")}</span>
                <span className="mt-3 text-sm text-[#3d4a63]">
                  {advisor.services.map((service) => `${service.title}: ${service.range}`).join(" · ")}
                </span>
                <span className="mt-3 text-xs font-semibold tracking-wide text-[#8a6112] uppercase">{engagementCopy.noRatings}</span>
                <span className="mt-3 text-xs font-semibold tracking-wide text-[#667085] uppercase">{engagementCopy.casesTitle}</span>
                {advisor.cases.length === 0 ? <span className="mt-1 text-sm text-[#667085]">{engagementCopy.noCases}</span> : null}
                {advisor.cases.length > 0 ? (
                  <span className="mt-2 flex flex-col gap-2">
                    {advisor.cases.map((item) => (
                      <span key={`${item.title}-${item.closedOn}`} className="text-sm text-[#3d4a63]">
                        {item.title} · {item.sector} · {item.closedOn} · {item.value}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
