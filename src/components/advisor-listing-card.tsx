"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

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
  active = false,
  onChoose,
}: {
  advisor: PublicAdvisorCard;
  active?: boolean;
  onChoose?: (id: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const frame = active
    ? "flex h-full w-full -translate-y-1 flex-col overflow-hidden rounded-3xl border border-[#465ab4] bg-white text-left shadow-[0_22px_50px_-20px_rgba(28,39,64,0.55)] ring-2 ring-[#465ab4]/25"
    : "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-left shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(28,39,64,0.5)]";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    }
  }, [open]);

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={frame}>
        <span className="relative bg-[#1c2740] px-5 py-6">
          <span className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <Stars />
            <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{engagementCopy.noRatings}</span>
          </span>
          <span className="block pr-28 text-lg font-semibold text-white">{advisor.businessName}</span>
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
            <h2 className="pr-28 text-2xl font-semibold text-white">{advisor.businessName}</h2>
            <p className="mt-1 pr-28 text-sm text-white/70">{advisor.sectors.join(" · ")}</p>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">
            {advisor.description.length > 0 ? <p className="text-sm leading-6 text-[#3d4a63]">{advisor.description}</p> : null}
            <div className="flex flex-col gap-2">
              {advisor.services.map((service) => (
                <p key={service.title} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{service.title}</span>
                  <span className="shrink-0 text-[#3d4a63]">{service.range}</span>
                </p>
              ))}
            </div>
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
              {onChoose ? (
                <button
                  type="button"
                  onClick={() => {
                    onChoose(advisor.id);
                    close();
                  }}
                  className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white"
                >
                  {engagementCopy.chooseThisAdvisor}
                </button>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
