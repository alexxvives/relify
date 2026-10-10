"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Star } from "lucide-react";
import { advisoryCopy, advisoryServiceIdFromTitle, type AdvisoryServiceId } from "@/lib/advisory";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#e7eaee] bg-white p-0 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40";

function caseCount(count: number): string {
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

function ReviewMark({ cases }: { cases: number }) {
  return (
    <span className="absolute top-4 right-4 flex w-36 flex-col items-end gap-1 text-right">
      <Stars />
      <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{engagementCopy.noRatings}</span>
      <span className="text-xs font-medium text-white">{caseCount(cases)}</span>
    </span>
  );
}

function SectorTags({ sectors }: { sectors: string[] }) {
  return (
    <span className="mt-3 flex flex-wrap gap-1.5 pr-36">
      {sectors.map((sector) => (
        <span key={sector} className="rounded-full bg-white/15 px-2.5 py-1 text-xs leading-4 whitespace-nowrap text-white">
          {sector}
        </span>
      ))}
    </span>
  );
}

export function AdvisorListingCard({
  advisor,
  connect = false,
  projectSlug,
  pending = false,
}: {
  advisor: PublicAdvisorCard;
  connect?: boolean;
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
        <span className="relative bg-[#1c2740] px-5 py-5">
          <ReviewMark cases={advisor.cases.length} />
          <span className="block pr-36 text-lg font-semibold text-white">{engagementCopy.advisorFallback}</span>
          <SectorTags sectors={advisor.sectors} />
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
        </span>
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className={dialogClass}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
          onClose={() => {
            setOpen(false);
          }}
        >
          <div className="relative bg-[#1c2740] px-6 py-6">
            <ReviewMark cases={advisor.cases.length} />
            <h2 className="pr-36 text-2xl font-semibold text-white">{engagementCopy.advisorFallback}</h2>
            <SectorTags sectors={advisor.sectors} />
          </div>
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">
            {advisor.description.length > 0 ? <p className="text-sm leading-6 text-[#3d4a63]">{advisor.description}</p> : null}
            {connect ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{engagementCopy.pickServices}</p>
                <div className="flex flex-col gap-2">
                  {offered.map((service) => {
                    const active = picked.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className={
                          active
                            ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-[#465ab4] bg-[#eef1ff] px-3 py-3 text-sm"
                            : "flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e7eaee] px-3 py-3 text-sm"
                        }
                      >
                        <input
                          type="checkbox"
                          name="services"
                          value={service.id}
                          checked={active}
                          onChange={() => {
                            setPicked((current) =>
                              current.includes(service.id) ? current.filter((item) => item !== service.id) : [...current, service.id],
                            );
                          }}
                          className="sr-only"
                        />
                        <span
                          className={
                            active
                              ? "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-[#465ab4] text-white"
                              : "inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-[#c5ced8] bg-white"
                          }
                          aria-hidden
                        >
                          {active ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className="font-medium">{service.title}</span>
                        <span className="ml-auto shrink-0 text-[#3d4a63]">{service.range}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
            {connect ? (
              <div className="flex items-center justify-end">
                {projectSlug ? <input type="hidden" name="advisorId" value={advisor.id} /> : null}
                <span title={projectSlug ? undefined : engagementCopy.connectNeedsCompany} className="inline-flex">
                  <button
                    type="submit"
                    disabled={pending || picked.length === 0 || !projectSlug}
                    className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:bg-[#e6e8f6] disabled:text-[#9aa3c7]"
                  >
                    {pending ? advisoryCopy.pending : engagementCopy.chooseThisAdvisor}
                  </button>
                </span>
              </div>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
