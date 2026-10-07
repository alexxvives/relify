"use client";

import { useActionState, useState } from "react";
import { Briefcase, Calculator, Check, FileSpreadsheet, Scale, Search, Users } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/asesoramiento/actions";
import { advisoryCopy, advisoryServices, type AdvisoryServiceId } from "@/lib/advisory";
import { engagementCopy } from "@/lib/engagement-copy";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";

const serviceStyle = {
  "due-diligence": { icon: Search, wash: "bg-[#eef2ff] text-[#465ab4]", fill: "bg-[#e4ebff]", mark: "bg-[#465ab4]" },
  valuation: { icon: Calculator, wash: "bg-[#e8f6ee] text-[#17663a]", fill: "bg-[#dff6e8]", mark: "bg-[#17663a]" },
  legal: { icon: Scale, wash: "bg-[#f3f1ff] text-[#5b4db8]", fill: "bg-[#ece8ff]", mark: "bg-[#5b4db8]" },
  tax: { icon: FileSpreadsheet, wash: "bg-[#fff6e8] text-[#8a6112]", fill: "bg-[#fff1d9]", mark: "bg-[#8a6112]" },
  "business-plan": { icon: Briefcase, wash: "bg-[#e7f6f6] text-[#0f6e73]", fill: "bg-[#d9f3f3]", mark: "bg-[#0f6e73]" },
  labor: { icon: Users, wash: "bg-[#fdeeee] text-[#9b3b2f]", fill: "bg-[#fce4e4]", mark: "bg-[#9b3b2f]" },
} as const;

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

  function toggle(id: AdvisoryServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {selected.map((id) => (
        <input key={id} type="hidden" name="services" value={id} />
      ))}
      {projectSlug ? <input type="hidden" name="projectSlug" value={projectSlug} /> : null}
      <input type="hidden" name="advisorId" value={advisorId} />
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
      <fieldset className="rounded-2xl border border-[#e7eaee] p-4">
        <legend className="px-1 text-sm font-semibold text-[#1c2740]">{engagementCopy.pickAdvisor}</legend>
        <p className="mt-1 text-sm text-[#5c6b78]">{engagementCopy.inboxChoiceBody}</p>
        {advisors.length === 0 ? <p className="mt-3 text-sm text-[#5c6b78]">{engagementCopy.directoryEmpty}</p> : null}
        <div className="mt-3 grid gap-3">
          <label className="flex cursor-pointer gap-3 rounded-xl border border-[#e7eaee] bg-white p-3">
            <input
              type="radio"
              name="advisorChoice"
              checked={advisorId === ""}
              onChange={() => {
                setAdvisorId("");
              }}
            />
            <span>
              <span className="block text-sm font-semibold text-[#1c2740]">{engagementCopy.inboxChoice}</span>
            </span>
          </label>
          {advisors.map((advisor) => (
            <label key={advisor.id} className="flex cursor-pointer gap-3 rounded-xl border border-[#e7eaee] bg-white p-3">
              <input
                type="radio"
                name="advisorChoice"
                checked={advisorId === advisor.id}
                onChange={() => {
                  setAdvisorId(advisor.id);
                }}
              />
              <span>
                <span className="block text-sm font-semibold text-[#1c2740]">{advisor.businessName}</span>
                <span className="mt-1 block text-sm text-[#5c6b78]">{advisor.sectors.join(", ")}</span>
                <span className="mt-1 block text-sm text-[#3d4a63]">
                  {advisor.services.map((service) => `${service.title}: ${service.range}`).join(" · ")}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
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
          disabled={pending || selected.length === 0}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
        >
          {pending ? advisoryCopy.pending : advisoryCopy.submit}
        </button>
      </div>
    </form>
  );
}
