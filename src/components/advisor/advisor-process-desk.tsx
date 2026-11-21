"use client";

import { useState, type ReactNode } from "react";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { AdvisorProcessThread } from "@/components/advisor/advisor-process-chats";
import { BuyerCardOverlay } from "@/components/advisor/advisor-rail-dock";
import { BuyerFilter } from "@/components/investor/buyer-filter";
import { InvestorProjectTabs, type ProcessTabId } from "@/components/investor/investor-project-tabs";
import { ProcessChatLayout } from "@/components/investor/process-chat-layout";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { AdvisorProcessChats } from "@/lib/server/advisor-process-chat";

const clientValue = "client";

/**
 * S40 (Alex): the advisor's encargo uses the buyer's process tabs. Chat / Documentos holds the conversation picked in
 * the filter at the right of the tab row (the client, or each buyer's process chat for a seller-hired advisor) next to
 * the documents; Reuniones holds the meetings with the client. Every panel only receives what the server already
 * allowed for this advisor (paid encargo, signed NDA).
 */
export function AdvisorProcessDesk({
  engagementId,
  company,
  documents,
  locked,
  thread,
  processChats,
  today,
  overlay = null,
}: {
  engagementId: string;
  company: ReactNode;
  documents: ReactNode;
  locked: ReactNode;
  thread: AdvisorContactView | null;
  processChats: AdvisorProcessChats | null;
  today: string;
  /** S41 (Alex): the buyer card overlay; open on entry, minimised once the advisor moves to Chat or Reuniones. */
  overlay?: ReactNode;
}) {
  const chats = processChats?.chats ?? [];
  const options = [
    ...(thread ? [{ value: clientValue, label: engagementCopy.filterClient }] : []),
    ...chats.map((chat) => ({ value: chat.accessId, label: chat.label })),
  ];
  const [selected, setSelected] = useState(chats[0]?.accessId ?? (thread ? clientValue : ""));
  const [tab, setTab] = useState<ProcessTabId>("company");
  const active = chats.find((chat) => chat.accessId === selected) ?? null;

  const chat =
    selected === clientValue && thread ? (
      <AdvisorContactDesk contacts={[thread]} today={today} showDocuments={false} pinned meetings={false} />
    ) : active && processChats ? (
      <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <AdvisorProcessThread engagementId={engagementId} side={processChats.side} chat={active} />
      </div>
    ) : (
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5 text-sm text-[#64748b]">{engagementCopy.processChatsEmpty}</div>
    );

  return (
    <>
    <InvestorProjectTabs
      onTabChange={setTab}
      actions={tab === "questions" ? <BuyerFilter value={selected} options={options} onChange={setSelected} /> : null}
      panels={{
        company,
        questions: thread || processChats ? <ProcessChatLayout bare chat={chat} documents={documents} /> : locked,
        meetings: thread ? <AdvisorContactDesk contacts={[thread]} today={today} showDocuments={false} pinned only="meetings" /> : locked,
      }}
    />
    {overlay ? <BuyerCardOverlay autoFold={tab !== "company"}>{overlay}</BuyerCardOverlay> : null}
    </>
  );
}
