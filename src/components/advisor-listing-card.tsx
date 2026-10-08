import { Star } from "lucide-react";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import { engagementCopy } from "@/lib/engagement-copy";

export function AdvisorListingCard({
  advisor,
  active = false,
  onChoose,
}: {
  advisor: PublicAdvisorCard;
  active?: boolean;
  onChoose?: (id: string) => void;
}) {
  const frame = active
    ? "flex h-full w-full -translate-y-1 flex-col overflow-hidden rounded-3xl border border-[#465ab4] bg-white text-left shadow-[0_22px_50px_-20px_rgba(28,39,64,0.55)] ring-2 ring-[#465ab4]/25"
    : "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-left shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-20px_rgba(28,39,64,0.5)]";
  const body = (
    <>
      <span className="bg-[#1c2740] px-5 py-6">
        <span className="block text-lg font-semibold text-white">{advisor.businessName}</span>
        <span className="mt-1 block text-sm text-white/70">{advisor.sectors.join(" · ")}</span>
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
        <span className="inline-flex items-center gap-1 text-[#8a6112]">
          {["1", "2", "3", "4", "5"].map((star) => (
            <Star key={star} className="size-3.5 text-[#d5dbe3]" aria-hidden />
          ))}
          <span className="ml-1 text-xs font-semibold tracking-wide uppercase">{engagementCopy.noRatings}</span>
        </span>
        <span className="text-xs font-semibold tracking-wide text-[#667085] uppercase">{engagementCopy.casesTitle}</span>
        {advisor.cases.length === 0 ? <span className="text-sm text-[#667085]">{engagementCopy.noCases}</span> : null}
        {advisor.cases.slice(0, 2).map((item) => (
          <span key={`${item.title}-${item.closedOn}`} className="text-sm text-[#3d4a63]">
            {item.title} · {item.sector} · {item.closedOn} · {item.value}
          </span>
        ))}
      </span>
    </>
  );

  if (!onChoose) {
    return <article className={frame}>{body}</article>;
  }

  return (
    <button type="button" aria-pressed={active} onClick={() => onChoose(advisor.id)} className={frame}>
      {body}
    </button>
  );
}
