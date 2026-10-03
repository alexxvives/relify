"use client";

import { useState } from "react";
import { Calendar, Link2, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { SellerTabs } from "@/components/seller-tabs";
import { sellerCopy } from "@/lib/seller-copy";

const tabs = [
  { id: "summary", label: sellerCopy.summary },
  { id: "active", label: sellerCopy.active },
  { id: "inactive", label: sellerCopy.inactive },
] as const;

type ProcessTab = (typeof tabs)[number]["id"];

const counters = [
  { label: sellerCopy.accepted, icon: Link2 },
  { label: sellerCopy.questionsIn, icon: MessageCircleQuestion },
  { label: sellerCopy.questionsOut, icon: MessageCircle },
  { label: sellerCopy.meetingsDone, icon: Calendar },
] as const;

export function SellerProcesses() {
  const [tab, setTab] = useState<ProcessTab>("summary");

  return (
    <div>
      <SellerTabs label={sellerCopy.processesTitle} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "summary" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-8 text-center">
            <h2 className="text-left text-lg font-semibold">{sellerCopy.pendingTitle}</h2>
            <p className="mt-10 text-sm font-semibold">{sellerCopy.pendingEmpty}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#667085]">{sellerCopy.pendingBody}</p>
            <button
              type="button"
              disabled
              className="mt-6 inline-flex h-10 items-center rounded-full border border-[#d0d5dd] px-4 text-sm text-[#98a2b3]"
            >
              {sellerCopy.contactManager}
            </button>
          </section>
          <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-8 text-center">
            <h2 className="text-left text-lg font-semibold">{sellerCopy.meetingsTitle}</h2>
            <p className="mt-1 text-left text-sm text-[#667085]">{sellerCopy.meetingsIntro}</p>
            <p className="mt-16 text-sm font-semibold">{sellerCopy.meetingsEmpty}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#667085]">{sellerCopy.meetingsEmptyBody}</p>
          </section>
          <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <h2 className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
            <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activitySummaryIntro}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {counters.map((item) => (
                <li key={item.label} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-semibold text-[#2b3b4a]">0</p>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#64748b]">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-4 text-[#64748b]">{item.label}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <p className="text-sm text-[#667085]">{sellerCopy.managerEmpty}</p>
          </section>
        </div>
      ) : null}
      {tab === "active" ? (
        <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-6">
          <h2 className="text-lg font-semibold">{sellerCopy.activeEmpty}</h2>
          <p className="mt-2 text-sm text-[#667085]">{sellerCopy.activeEmptyBody}</p>
        </section>
      ) : null}
      {tab === "inactive" ? (
        <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-6">
          <h2 className="text-lg font-semibold">{sellerCopy.inactiveEmpty}</h2>
          <p className="mt-2 text-sm text-[#667085]">{sellerCopy.inactiveEmptyBody}</p>
        </section>
      ) : null}
    </div>
  );
}
