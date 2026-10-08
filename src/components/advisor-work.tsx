"use client";

import { useActionState } from "react";
import Link from "next/link";
import { claimEngagementAction, startInboxCheckoutAction, type EngagementActionState } from "@/app/mandatos/encargos/actions";
import { engagementCopy } from "@/lib/engagement-copy";
import type { PublicAdvisorCard } from "@/lib/advisor-directory";
import type { EngagementCard } from "@/server/advisoryEngagement";

function Note({ state }: { state: EngagementActionState }) {
  if (!state) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-[#17663a]" : "text-sm text-red-700"} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

function ClaimForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(claimEngagementAction, null);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="engagementId" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? engagementCopy.claiming : engagementCopy.claim}
      </button>
      <Note state={state} />
    </form>
  );
}

function WorkList({ items, claim }: { items: EngagementCard[]; claim: boolean }) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-[#64748b]">{claim ? engagementCopy.inboxEmpty : engagementCopy.mineEmpty}</p>;
  }

  return (
    <ul className="mt-4 grid gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-[#e7eaee] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#1c2740]">{item.codename}</h3>
              <p className="mt-1 text-sm text-[#64748b]">
                {item.region} · {item.clientLabel}
              </p>
              <p className="mt-1 text-sm text-[#3d4a63]">{item.services}</p>
            </div>
            {claim ? <ClaimForm id={item.id} /> : (
              <Link href={`/mandatos/encargos/${item.id}`} className="text-sm font-medium text-[#465ab4]">
                Abrir encargo
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdvisorWork({
  paid,
  mine,
  inbox,
  advisors,
}: {
  paid: boolean;
  mine: EngagementCard[];
  inbox: EngagementCard[];
  advisors: PublicAdvisorCard[];
}) {
  const [state, action, pending] = useActionState(startInboxCheckoutAction, null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.listTitle}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.directoryIntro}</p>
        {advisors.length === 0 ? <p className="mt-4 text-sm text-[#64748b]">{engagementCopy.directoryEmpty}</p> : null}
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {advisors.map((advisor) => (
            <li key={advisor.id} className="rounded-2xl bg-[#f7f8fb] p-4">
              <p className="text-base font-semibold text-[#1c2740]">{engagementCopy.advisorFallback}</p>
              <p className="mt-2 text-sm text-[#5c6b78]">{advisor.sectors.join(", ")}</p>
              <p className="mt-2 text-sm text-[#3d4a63]">
                {advisor.services.map((service) => `${service.title}: ${service.range}`).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.mineTitle}</h2>
        <WorkList items={mine} claim={false} />
      </section>
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.inboxTitle}</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              {paid ? `${engagementCopy.planCurrent} ${engagementCopy.planPrice}. ${engagementCopy.planGross}.` : engagementCopy.inboxLocked}
            </p>
          </div>
          {paid ? null : (
            <form action={action}>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Abriendo el pago…" : engagementCopy.choosePlan}
              </button>
            </form>
          )}
        </div>
        <Note state={state} />
        {paid ? <WorkList items={inbox} claim /> : null}
      </section>
    </div>
  );
}
