"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { advisoryCopy, advisoryServiceIdFromTitle, type AdvisoryServiceId } from "@/lib/advisory";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

type CompanyOption = { slug: string; codename: string; region: string };

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#e7eaee] bg-white p-0 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40";

function caseLabel(count: number): string {
  if (count === 0) {
    return engagementCopy.noCases;
  }

  if (count === 1) {
    return "1 caso cerrado";
  }

  return `${count} casos cerrados`;
}

function Stars() {
  return (
    <span className="inline-flex items-center gap-0.5 text-white/80" aria-hidden>
      {["1", "2", "3", "4", "5"].map((star) => (
        <Star key={star} className="size-3.5" />
      ))}
    </span>
  );
}

export function AdvisorListingCard({
  advisor,
  connect = false,
  companies = [],
  projectSlug,
  pending = false,
}: {
  advisor: PublicAdvisorCard;
  connect?: boolean;
  companies?: CompanyOption[];
  projectSlug?: string;
  pending?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<AdvisoryServiceId[]>([]);
  const offered = advisor.services.flatMap((service) => {
    const id = advisoryServiceIdFromTitle(service.title);
    return id ? [{ id, title: service.title, range: service.range }] : [];
  });
  const canConnect = connect && (Boolean(projectSlug) || companies.length > 0);
  const frame =
    "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-left shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(28,39,64,0.5)]";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    }
  }, [open]);

  useEffect(() => {
    if (pending) {
      submitting.current = true;
      return;
    }

    if (!submitting.current) {
      return;
    }

    submitting.current = false;
    dialogRef.current?.close();
  }, [pending]);

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPicked([]);
          setOpen(true);
        }}
        className={frame}
      >
        <span className="relative bg-[#1c2740] px-5 py-6">
          <span className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <Stars />
            <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{engagementCopy.noRatings}</span>
          </span>
          <span className="block pr-28 text-lg font-semibold text-white">{engagementCopy.advisorFallback}</span>
          <span className="mt-1 block pr-28 text-sm text-white/70">{advisor.sectors.join(" · ")}</span>
        </span>
        <span className="flex flex-1 flex-col gap-3 p-5">
          <span className="flex flex-col gap-2">
            {advisor.services.map((service) => (
              <span key={service.title} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-[#1c2740]">{service.title}</span>
                <span className="shrink-0 text-[#3d4a63]">{service.range}</span>
              </span>
            ))}
          </span>
          <span className="text-sm font-medium text-[#1c2740]">{caseLabel(advisor.cases.length)}</span>
        </span>
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className={dialogClass}
          onClose={() => {
            setOpen(false);
          }}
        >
          <div className="relative bg-[#1c2740] px-6 py-6">
            <span className="absolute top-4 right-4 flex flex-col items-end gap-1">
              <Stars />
              <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{engagementCopy.noRatings}</span>
            </span>
            <h2 className="pr-28 text-2xl font-semibold text-white">{engagementCopy.advisorFallback}</h2>
            <p className="mt-1 pr-28 text-sm text-white/70">{advisor.sectors.join(" · ")}</p>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">
            {advisor.description.length > 0 ? <p className="text-sm leading-6 text-[#3d4a63]">{advisor.description}</p> : null}
            {connect ? (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{engagementCopy.pickServices}</legend>
                {offered.map((service) => (
                  <label key={service.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="services"
                      value={service.id}
                      checked={picked.includes(service.id)}
                      onChange={() => {
                        setPicked((current) =>
                          current.includes(service.id) ? current.filter((id) => id !== service.id) : [...current, service.id],
                        );
                      }}
                      className="size-4 accent-[#465ab4]"
                    />
                    <span className="font-medium">{service.title}</span>
                    <span className="ml-auto shrink-0 text-[#3d4a63]">{service.range}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <div className="flex flex-col gap-2">
                {advisor.services.map((service) => (
                  <p key={service.title} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{service.title}</span>
                    <span className="shrink-0 text-[#3d4a63]">{service.range}</span>
                  </p>
                ))}
              </div>
            )}
            {connect && !projectSlug && companies.length > 0 ? (
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
            {connect && !projectSlug && companies.length === 0 ? (
              <p className="text-sm text-[#5c6b78]">{engagementCopy.companyNdaOnly}</p>
            ) : null}
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{engagementCopy.casesTitle}</p>
              <p className="mt-2 text-sm font-medium">{caseLabel(advisor.cases.length)}</p>
              {advisor.cases.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {advisor.cases.map((item) => (
                    <li key={`${item.sector}-${item.closedOn}-${item.value}`} className="text-sm text-[#3d4a63]">
                      {item.sector} · {item.closedOn} · {item.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={close} className="inline-flex h-10 items-center rounded-full border border-[#e7eaee] px-4 text-sm font-medium">
                {engagementCopy.closeAdvisor}
              </button>
              {canConnect ? (
                <>
                  <input type="hidden" name="advisorId" value={advisor.id} />
                  <button
                    type="submit"
                    disabled={pending || picked.length === 0}
                    className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
                  >
                    {pending ? advisoryCopy.pending : engagementCopy.chooseThisAdvisor}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
