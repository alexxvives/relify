"use client";

import { VerifiedBadge } from "@/components/project-photo";
import { useActionState, useEffect, useRef, useState } from "react";
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
    <span className="flex shrink-0 flex-col items-end gap-1 text-right">
      <Stars />
      <span className="text-xs font-semibold text-white/70">{engagementCopy.noRatings}</span>
      <span className="text-xs font-medium text-white">{caseCount(cases)}</span>
    </span>
  );
}

function SectorChips({ sectors, hidden = false }: { sectors: string[]; hidden?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 pr-1.5" aria-hidden={hidden || undefined}>
      {sectors.map((sector) => (
        <span key={sector} className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs leading-4 whitespace-nowrap text-white">
          {sector}
        </span>
      ))}
    </span>
  );
}

function SectorTags({ sectors }: { sectors: string[] }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const row = rowRef.current;
    if (!box || !row) {
      return;
    }
    const measure = () => setOverflow(row.scrollWidth > box.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [sectors]);

  return (
    <span ref={boxRef} className="releva-tag-marquee mt-4 flex min-h-6 overflow-hidden" title={sectors.join(" · ")} data-overflow={overflow || undefined}>
      <span className="releva-tag-track flex w-max">
        <span ref={rowRef} className="flex">
          <SectorChips sectors={sectors} />
        </span>
        {overflow ? <SectorChips sectors={sectors} hidden /> : null}
      </span>
    </span>
  );
}

export function AdvisorListingCard({
  advisor,
  connect = false,
  projectSlug,
  natural = false,
}: {
  advisor: PublicAdvisorCard;
  connect?: boolean;
  projectSlug?: string;
  natural?: boolean;
}) {
  const [state, action, pending] = useActionState<AdvisoryQuoteState, FormData>(requestAdvisoryQuoteAction, null);
  const [picked, setPicked] = useState<AdvisoryServiceId[]>([]);
  const offered = advisor.services.flatMap((service) => {
    const id = advisoryServiceIdFromTitle(service.title);
    return id ? [{ id, title: service.title, range: service.range }] : [];
  });
  const frame = natural
    ? "flex w-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white text-left text-[#1c2740] shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]"
    : "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white text-left text-[#1c2740] shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]";

  return (
    <article className={frame}>
      <div className="bg-[linear-gradient(135deg,#1c2740_0%,#27366b_100%)] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">{advisor.name || engagementCopy.advisorFallback}</p>
            <div className="mt-2 flex min-h-6 items-center">{advisor.verified ? <VerifiedBadge /> : null}</div>
          </div>
          <ReviewMark cases={advisor.cases.length} />
        </div>
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
        <div className={natural ? "flex flex-col gap-2 p-5" : "flex flex-1 flex-col gap-2 p-5"}>
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
