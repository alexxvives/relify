"use client";

import { useState, type ReactNode } from "react";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { AdvisorProcessThread } from "@/components/advisor/advisor-process-chats";
import { BuyerCardOverlay } from "@/components/advisor/advisor-rail-dock";
import { BuyerFilter } from "@/components/investor/buyer-filter";
import { InvestorProjectTabs, type ProcessTabId } from "@/components/investor/investor-project-tabs";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { CounterpartyPanel } from "@/components/investor/process-chat-layout";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { advisorPrivateTab, counterpartyTabIds } from "@/lib/process-tabs";
import type { AdvisorProcessChats } from "@/lib/server/advisor-process-chat";

export type AdvisorDeskLocks = { chat: ReactNode; documents: ReactNode; meetings: ReactNode };

function EmptyCard({ text }: { text: string }) {
  return <div className="h-full rounded-2xl border border-[#e6e9f0] bg-white p-5 text-sm leading-6 text-[#64748b]">{text}</div>;
}

/**
 * S43 (Alex t184u): the advisor's encargo has Información de la empresa, Comprador and Vendedor. The client's tab
 * (Comprador when a buyer hired the advisor, Vendedor when the seller did) is the private 1:1 thread with the client;
 * the other one is the shared process chat (buyer + seller + advisor, marked "Asesor") with the process documents
 * and its meetings (read-only). A seller's advisor picks the buyer in the filter of the Comprador tab. Every panel
 * only receives what the server already allowed (own encargo, accepted, NDA for documents); `locks` replaces the
 * three sections while the encargo is not accepted.
 */
export function AdvisorProcessDesk({
  engagementId,
  hiredBy,
  company,
  documents,
  locks,
  thread,
  processChats,
  today,
  overlay = null,
}: {
  engagementId: string;
  hiredBy: "investor" | "seller";
  company: ReactNode;
  documents: ReactNode;
  locks: AdvisorDeskLocks | null;
  thread: AdvisorContactView | null;
  processChats: AdvisorProcessChats | null;
  today: string;
  /** S41 (Alex): the buyer card overlay; open on entry, minimised once the advisor leaves the company tab. */
  overlay?: ReactNode;
}) {
  const chats = processChats?.chats ?? [];
  const [selected, setSelected] = useState(chats[0]?.accessId ?? "");
  const [tab, setTab] = useState<ProcessTabId>("company");
  const active = chats.find((chat) => chat.accessId === selected) ?? chats[0] ?? null;
  const privateTab = advisorPrivateTab(hiredBy);
  const sharedTab = privateTab === "buyer" ? "seller" : "buyer";
  const options = chats.map((chat) => ({ value: chat.accessId, label: chat.label }));

  const lockedPanel = locks ? <CounterpartyPanel bare chat={locks.chat} documents={locks.documents} meetings={locks.meetings} /> : null;
  const privatePanel =
    lockedPanel ??
    (thread ? (
      <AdvisorContactDesk contacts={[thread]} today={today} stacked />
    ) : (
      <EmptyCard text={engagementCopy.privateChatEmpty} />
    ));
  const sharedPanel = lockedPanel ?? (
    <CounterpartyPanel
      bare
      chat={
        active && processChats ? (
          <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <AdvisorProcessThread engagementId={engagementId} side={processChats.side} chat={active} />
          </div>
        ) : (
          <EmptyCard text={engagementCopy.sharedChatEmpty} />
        )
      }
      documents={documents}
      meetings={active ? <MeetingDesk key={active.accessId} messages={active.meetings} hidden={[]} today={today} /> : null}
    />
  );

  return (
    <>
    <InvestorProjectTabs
      ids={counterpartyTabIds("advisor")}
      onTabChange={setTab}
      // S43: the buyer filter belongs to the shared Comprador tab of a seller's advisor with several buyers.
      actions={tab === sharedTab && options.length > 1 ? <BuyerFilter value={active?.accessId ?? ""} options={options} onChange={setSelected} /> : null}
      panels={{
        company,
        [privateTab]: privatePanel,
        [sharedTab]: sharedPanel,
      }}
    />
    {overlay ? <BuyerCardOverlay autoFold={tab !== "company"}>{overlay}</BuyerCardOverlay> : null}
    </>
  );
}
