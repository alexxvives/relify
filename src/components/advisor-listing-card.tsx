"use client";

import { useActionState, useState } from "react";
import { Check, Star } from "lucide-react";
import { requestAdvisoryQuoteAction, type AdvisoryQuoteState } from "@/app/asesoramiento/actions";
import { AppToast } from "@/components/app-toast";
import { advisoryCopy, advisoryServiceIdFromTitle, type AdvisoryServiceId } from "@/lib/advisory";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

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
}: {
  advisor: PublicAdvisorCard;
  connect?: boolean;
  projectSlug?: string;
}) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [picked, setPicked] = useState<AdvisoryServiceId[]>([]);
  const offered = advisor.services.flatMap((service) => {
    const id = advisoryServiceIdFromTitle(service.title);
    return id ? [{ id, title: service.title, range: service.range }] : [];
  });
  const frame =
    "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-left text-[#1c2740] shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]";

  return (
    <article className={frame}>
      <div className="relative bg-[#1c2740] px-5 py-5">
        <ReviewMark cases={advisor.cases.length} />
        <p className="pr-36 text-lg font-semibold text-white">{engagementCopy.advisorFallback}</p>
        <SectorTags sectors={advisor.sectors} />
      </div>
      {connect ? (
        <form action={action} className="flex flex-1 flex-col gap-3 p-5">
          {projectSlug ? <input type="hidden" name="projectSlug" value={projectSlug} /> : null}
          {projectSlug ? <input type="hidden" name="advisorId" value={advisor.id} /> : null}
          <div className="flex flex-col gap-2">
            {offered.map((service) => {
              const active = picked.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={
                    active
                      ? "flex cursor-pointer items-center gap-3 rounded-2xl border border-[#465ab4] bg-[#eef1ff] px-3 py-2.5 text-sm"
                      : "flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e7eaee] px-3 py-2.5 text-sm"
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
          <div className="mt-auto flex justify-end pt-2">
            <span title={projectSlug ? undefined : engagementCopy.connectNeedsCompany} className="inline-flex">
              <button
                type="submit"
                disabled={pending || picked.length === 0 || !projectSlug}
                className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:pointer-events-none disabled:bg-[#e7eaee] disabled:text-[#8b95a7]"
              >
                {pending ? advisoryCopy.pending : engagementCopy.requestService}
              </button>
            </span>
          </div>
          <AppToast message={state?.message ?? null} tone={state?.ok ? "ok" : "error"} />
        </form>
      ) : (
        <div className="flex flex-1 flex-col gap-2 p-5">
          {advisor.services.map((service) => (
            <p key={service.title} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{service.title}</span>
              <span className="shrink-0 text-[#3d4a63]">{service.range}</span>
            </p>
          ))}
          {advisor.description.length > 0 ? <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{advisor.description}</p> : null}
        </div>
      )}
    </article>
  );
}
