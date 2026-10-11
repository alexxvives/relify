import Link from "next/link";
import { advisorCopy } from "@/lib/advisor-copy";
import { type AdvisorStep } from "@/lib/engagement";
import { engagementCopy } from "@/lib/engagement-copy";
import type { EngagementCard } from "@/server/advisoryEngagement";

const stepOrder: AdvisorStep[] = ["deposit", "nda", "active", "closed", "request"];

const stepLabel: Record<AdvisorStep, string> = {
  request: advisorCopy.stepRequest,
  deposit: advisorCopy.stepDeposit,
  nda: advisorCopy.stepNda,
  active: advisorCopy.stepActive,
  closed: advisorCopy.stepClosed,
};

const stepTone: Record<AdvisorStep, string> = {
  request: "bg-[#f4f4f5] text-[#3d4a63]",
  deposit: "bg-[#fff4d6] text-[#8a6112]",
  nda: "bg-[#eef2ff] text-[#3d34b8]",
  active: "bg-[#e8f6ee] text-[#17663a]",
  closed: "bg-[#f4f4f5] text-[#3d4a63]",
};

function WorkCard({ item }: { item: EngagementCard }) {
  return (
    <li className="rounded-3xl border border-[#e7eaee] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stepTone[item.step]}`}>
            {stepLabel[item.step]}
          </span>
          <h3 className="mt-3 text-xl font-semibold text-[#1c2740]">{item.codename}</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            {item.region} · {item.clientLabel}
          </p>
          {item.services.length > 0 ? <p className="mt-2 text-sm text-[#3d4a63]">{item.services}</p> : null}
        </div>
        <Link
          href={`/mandatos/encargos/${item.id}`}
          className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white"
        >
          {advisorCopy.processesOpen}
        </Link>
      </div>
    </li>
  );
}

export function AdvisorWork({ mine }: { mine: EngagementCard[] }) {
  const groups = stepOrder.flatMap((step) => {
    const items = mine.filter((item) => item.step === step);
    return items.length === 0 ? [] : [{ step, items }];
  });

  return (
    <section className="rounded-3xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-2xl font-semibold text-[#1c2740]">{engagementCopy.mineTitle}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748b]">{engagementCopy.mineIntro}</p>
      {groups.length === 0 ? <p className="mt-6 text-sm text-[#64748b]">{engagementCopy.mineEmpty}</p> : null}
      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.step}>
            <h3 className="text-sm font-semibold tracking-wide text-[#64748b] uppercase">{stepLabel[group.step]}</h3>
            <ul className="mt-3 grid gap-3">
              {group.items.map((item) => (
                <WorkCard key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
