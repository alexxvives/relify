"use client";

import { useMemo, useActionState, useState } from "react";
import { Briefcase, Calculator, Check, FileSpreadsheet, Scale, Search, Users } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/asesoramiento/actions";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { FilterSelect } from "@/components/ui/filter-select";
import { advisoryCopy, advisoryServices, type AdvisoryServiceId } from "@/lib/advisory";
import {
  advisorMarketplaceSorts,
  filterPublicAdvisors,
  sortPublicAdvisors,
  type AdvisorMarketplaceSort,
  type PublicAdvisorCard,
} from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

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
  companies = [],
  initialCompany = "",
  contacts = [],
  today,
}: {
  layout?: "list" | "cards";
  advisors?: PublicAdvisorCard[];
  companies?: { slug: string; codename: string; region: string }[];
  initialCompany?: string;
  contacts?: AdvisorContactView[];
  today: string;
}) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [selected, setSelected] = useState<AdvisoryServiceId[]>([]);
  const [tab, setTab] = useState<"general" | "market" | "contacts">("market");
  const [company, setCompany] = useState(initialCompany);
  const cards = layout === "cards";
  const general = tab === "general";

  function toggle(id: AdvisoryServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const needsCompany = companies.length === 0 || company.length === 0;
  const hint = tab === "contacts" ? engagementCopy.contactsHint : general ? engagementCopy.generalHint : null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex gap-1 border-b border-[#e7eaee]" role="tablist" aria-label={advisoryCopy.heading}>
        {(
          [
            ["market", engagementCopy.marketTab],
            ["general", engagementCopy.generalTab],
            ["contacts", engagementCopy.contactsTab],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
            }}
            className={
              tab === id
                ? "-mb-px border-b-2 border-[#465ab4] px-3 py-2 text-base text-[#465ab4]"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-base text-[#64748b]"
            }
          >
            {label}
          </button>
        ))}
      </div>
      {hint ? <p className="text-sm text-[#5c6b78]">{hint}</p> : null}
      {tab === "contacts" ? <AdvisorContactDesk contacts={contacts} today={today} allowRemove /> : (
      <form action={action} className="flex flex-col gap-4">
      {general
        ? selected.map((id) => <input key={id} type="hidden" name="services" value={id} />)
        : null}
      {general && companies.length > 1 ? (
        <label className="text-sm font-medium text-[#1c2740]">
          {engagementCopy.pickCompany}
          <select
            name="projectSlug"
            required
            value={company}
            onChange={(event) => {
              setCompany(event.target.value);
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#d5dbe3] bg-white px-3"
          >
            <option value="">{engagementCopy.companyRequired}</option>
            {companies.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.codename} · {item.region}
              </option>
            ))}
          </select>
        </label>
      ) : general && companies.length === 0 ? (
        <p className="text-sm text-[#5c6b78]">{engagementCopy.companyNdaOnly}</p>
      ) : general && company ? (
        <input type="hidden" name="projectSlug" value={company} />
      ) : null}
      {general ? <ul className={cards ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
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
      </ul> : (
        <AdvisorMarket
          advisors={advisors}
          companies={companies}
          company={company}
          onCompany={setCompany}
          pending={pending}
        />
      )}
      {state ? (
        <p
          role="status"
          className={
            state.ok
              ? "fixed top-6 right-8 z-50 max-w-sm rounded-2xl bg-[#17663a] px-4 py-3 text-sm leading-6 text-white shadow-[0_16px_40px_-24px_rgba(28,39,64,0.55)]"
              : "fixed top-6 right-8 z-50 max-w-sm rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm leading-6 text-red-700 shadow-[0_16px_40px_-24px_rgba(28,39,64,0.55)]"
          }
        >
          {state.message}
        </p>
      ) : null}
      {general ? (
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
          disabled={pending || needsCompany || selected.length === 0}
          className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
        >
          {pending ? advisoryCopy.pending : advisoryCopy.submit}
        </button>
      </div>
      ) : null}
      </form>
      )}
    </div>
  );
}

const sortLabels: Record<AdvisorMarketplaceSort, string> = {
  recommended: engagementCopy.marketplaceSortRecommended,
  "price-asc": engagementCopy.marketplaceSortPriceAsc,
  "price-desc": engagementCopy.marketplaceSortPriceDesc,
};

function isAdvisorSort(value: string): value is AdvisorMarketplaceSort {
  return advisorMarketplaceSorts.some((sort) => sort === value);
}

function AdvisorMarket({
  advisors,
  companies,
  company,
  onCompany,
  pending,
}: {
  advisors: PublicAdvisorCard[];
  companies: { slug: string; codename: string; region: string }[];
  company: string;
  onCompany: (slug: string) => void;
  pending: boolean;
}) {
  const [sector, setSector] = useState("");
  const [service, setService] = useState("");
  const [sort, setSort] = useState<AdvisorMarketplaceSort>("recommended");
  const sectors = useMemo(
    () => [...new Set(advisors.flatMap((advisor) => advisor.sectors))].sort((left, right) => left.localeCompare(right, "es")),
    [advisors],
  );
  const services = useMemo(
    () => [...new Set(advisors.flatMap((advisor) => advisor.services.map((item) => item.title)))].sort((left, right) => left.localeCompare(right, "es")),
    [advisors],
  );
  const filtered = filterPublicAdvisors(advisors, { sector, service });
  const visible = sort === "recommended" ? filtered : sortPublicAdvisors(filtered, sort);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-[#1c2740]">{engagementCopy.marketplaceTitle}</h3>
      </div>
      <div className="rounded-2xl border border-[#e7eaee] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {engagementCopy.pickCompany}
            {companies.length > 0 ? (
              <FilterSelect
                label={engagementCopy.pickCompany}
                value={company}
                options={[
                  ...(companies.length === 1 ? [] : [{ value: "", label: engagementCopy.companyRequired }]),
                  ...companies.map((item) => ({ value: item.slug, label: `${item.codename} · ${item.region}` })),
                ]}
                onValueChange={onCompany}
              />
            ) : (
              <span className="flex h-11 items-center rounded-xl border border-[#e1e6ee] bg-[#f7f8fb] px-3 text-sm text-[#8b95a7]">
                {engagementCopy.marketplaceCompanyEmpty}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {engagementCopy.marketplaceSector}
            <FilterSelect
              label={engagementCopy.marketplaceSector}
              value={sector}
              options={[{ value: "", label: engagementCopy.marketplaceSectorAll }, ...sectors.map((item) => ({ value: item, label: item }))]}
              onValueChange={setSector}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {engagementCopy.marketplaceService}
            <FilterSelect
              label={engagementCopy.marketplaceService}
              value={service}
              options={[{ value: "", label: engagementCopy.marketplaceServiceAll }, ...services.map((item) => ({ value: item, label: item }))]}
              onValueChange={setService}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-[#5c6b78]">
            {engagementCopy.marketplaceSort}
            <FilterSelect
              label={engagementCopy.marketplaceSort}
              value={sort}
              options={advisorMarketplaceSorts.map((item) => ({ value: item, label: sortLabels[item] }))}
              onValueChange={(next) => {
                if (isAdvisorSort(next)) {
                  setSort(next);
                }
              }}
            />
          </label>
        </div>
      </div>
      {companies.length === 0 ? <p className="text-sm text-[#5c6b78]">{engagementCopy.companyNdaOnly}</p> : null}
      {company ? <input type="hidden" name="projectSlug" value={company} /> : null}
      {visible.length === 0 ? <p className="text-sm text-[#5c6b78]">{engagementCopy.marketplaceEmpty}</p> : null}
      <ul className="grid justify-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(32rem,36rem))]">
        {visible.map((advisor) => (
          <li key={advisor.id}>
            <AdvisorListingCard advisor={advisor} connect={companies.length > 0} projectSlug={company} pending={pending} />
          </li>
        ))}
      </ul>
    </section>
  );
}
