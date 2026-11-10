"use client";

import { Pagination, usePageParam } from "@/components/pagination";
import { useMemo, useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Calculator, Check, FileSpreadsheet, Scale, Search, Users, X } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/(app)/asesoramiento/actions";
import { AppToast } from "@/components/app-toast";
import { AdvisorListingCard } from "@/components/advisor-listing-card";
import { useModalScrollLock } from "@/components/file-preview-dialog";
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
import { FilterEmptyState, MutedAdvisorCards } from "@/components/filter-empty-state";

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
}: {
  layout?: "list" | "cards";
  advisors?: PublicAdvisorCard[];
  companies?: { slug: string; codename: string; region: string }[];
  initialCompany?: string;
}) {
  const [company, setCompany] = useState(initialCompany);
  const [askOpen, setAskOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cards = layout === "cards";

  return (
    <div className="flex flex-col gap-4">
      <AdvisorMarket
        advisors={advisors}
        companies={companies}
        company={company}
        onCompany={setCompany}
        onAsk={() => {
          setAskOpen(true);
        }}
      />
      <AppToast message={toast} />
      {askOpen ? (
        <ServiceAskDialog
          company={company}
          cards={cards}
          onClose={() => {
            setAskOpen(false);
          }}
          onDone={(message) => {
            setAskOpen(false);
            setToast(message);
          }}
        />
      ) : null}
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

const ADVISOR_PAGE_SIZE = 8;

function AdvisorMarket({
  advisors,
  companies,
  company,
  onCompany,
  onAsk,
}: {
  advisors: PublicAdvisorCard[];
  companies: { slug: string; codename: string; region: string }[];
  company: string;
  onCompany: (slug: string) => void;
  onAsk: () => void;
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
  const sorted = sort === "recommended" ? filtered : sortPublicAdvisors(filtered, sort);
  const paging = usePageParam(sorted.length, ADVISOR_PAGE_SIZE, JSON.stringify([sector, service, sort]));
  const visible = sorted.slice(paging.start, paging.end);
  const filtersActive = sector !== "" || service !== "";

  return (
    <section className="flex flex-col gap-4">
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
      {sorted.length === 0 ? (
        <FilterEmptyState
          message={filtersActive ? engagementCopy.marketplaceEmpty : engagementCopy.marketplaceEmptyUnfiltered}
          actionLabel={filtersActive ? engagementCopy.clearFilters : undefined}
          onClear={
            filtersActive
              ? () => {
                  setSector("");
                  setService("");
                  setSort("recommended");
                }
              : undefined
          }
        >
          <MutedAdvisorCards />
        </FilterEmptyState>
      ) : (
      <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,26rem),1fr))]">
        {visible.map((advisor) => (
          <li key={advisor.id}>
            <AdvisorListingCard advisor={advisor} connect projectSlug={company.length > 0 ? company : undefined} />
          </li>
        ))}
      </ul>
      )}
      <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <span className="hidden sm:block" />
        <div className="flex justify-center">
          <Pagination className="" page={paging.page} pages={paging.pages} onChange={paging.setPage} />
        </div>
        <div className="flex sm:justify-end">
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex h-10 items-center rounded-full border border-[#c5d0f5] bg-[#f4f7ff] px-5 text-sm font-semibold text-[#465ab4] hover:bg-[#e8eeff] focus-visible:outline-2 focus-visible:outline-[#465ab4]"
          >
            {engagementCopy.missingAsk}
          </button>
        </div>
      </div>
    </section>
  );
}

function ServiceAskDialog({
  company,
  cards,
  onClose,
  onDone,
}: {
  company: string;
  cards: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [selected, setSelected] = useState<AdvisoryServiceId[]>([]);
  const told = useRef(false);
  useModalScrollLock(true);

  useEffect(() => {
    if (state?.ok && !told.current) {
      told.current = true;
      onDone(state.message);
    }
  }, [onDone, state]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function toggle(id: AdvisoryServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1224]/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        action={action}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-[#1c2740] shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 pr-2">
            <h2 className="text-xl font-semibold">{engagementCopy.missingAsk}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{engagementCopy.missingAskBody}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={engagementCopy.closeAdvisor}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e7eaee] text-[#3d4a63] hover:bg-[#f4f7ff]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {company ? <input type="hidden" name="projectSlug" value={company} /> : null}
        {selected.map((id) => (
          <input key={id} type="hidden" name="services" value={id} />
        ))}
        <ul className={cards ? "mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2" : "mt-5 grid min-w-0 gap-3"}>
          {advisoryServices.map((service) => {
            const style = serviceStyle[service.id];
            const Icon = style.icon;
            const active = selected.includes(service.id);
            const cardSize = cards ? " h-full min-h-44 w-full items-start" : "";
            return (
              <li key={service.id} className={cards ? "flex" : undefined}>
                <label className={(active ? `flex cursor-pointer gap-4 rounded-2xl border border-transparent p-4 ${style.fill}` : "flex cursor-pointer gap-4 rounded-2xl border border-[#e7eaee] bg-white p-4") + cardSize}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => {
                      toggle(service.id);
                    }}
                  />
                  <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${style.wash}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{service.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#5c6b78]">{service.body}</span>
                  </span>
                  <span
                    className={
                      active
                        ? `ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white ${style.mark}`
                        : "ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[#d5dbe3] bg-white"
                    }
                    aria-hidden
                  >
                    {active ? <Check className="size-3.5" /> : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {state && !state.ok ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || selected.length === 0 || state?.ok === true}
            className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
          >
            {pending ? advisoryCopy.pending : advisoryCopy.submit}
          </button>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
}
