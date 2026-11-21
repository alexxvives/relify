"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BuyerCardOverlay } from "@/components/advisor/advisor-rail-dock";
import { BuyerCardSlider } from "@/components/advisor/buyer-card-slider";
import { approveSellerMeetingAction, postSellerMessageAction, rescheduleSellerMeetingAction } from "@/app/(app)/mi-empresa/procesos/actions";
import { markThreadReadAction } from "@/app/proyectos/[slug]/actions";
import { BuyerFilter } from "@/components/investor/buyer-filter";
import { ProcessRoom } from "@/components/investor/deal-pipeline";
import { InvestorProjectTabs, type ProcessTabId } from "@/components/investor/investor-project-tabs";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { ProcessChatLayout } from "@/components/investor/process-chat-layout";
import { ProjectThread } from "@/components/investor/project-thread";
import { FichaLockedNote } from "@/components/company/company-ficha-view";
import type { PublicInvestorCard } from "@/lib/demo-profile";
import type { SellerThread } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";

/**
 * S40 (Alex): the seller's process ficha uses the buyer's tabs (Información de la empresa / Chat / Documentos /
 * Reuniones). With several buyers in process, the filter at the right of the Chat / Reuniones tab row swaps the buyer
 * in place (S41: no page load) and the buyer card overlay follows it.
 */
export function SellerProcessDesk({
  company,
  threads,
  initialAccessId,
  buyers,
  today,
  initialTab,
}: {
  company: ReactNode;
  /** S41: every process thread of this company, so the buyer filter swaps without a page load. */
  threads: SellerThread[];
  initialAccessId: string;
  /** Filter options and buyer cards (real names). The filter lists only buyers whose process is open. */
  buyers: { accessId: string; label: string; card: PublicInvestorCard | null; open: boolean }[];
  today: string;
  initialTab: ProcessTabId;
}) {
  const [tab, setTab] = useState<ProcessTabId>(initialTab);
  const [selected, setSelected] = useState(initialAccessId);
  const thread = threads.find((row) => row.accessId === selected) ?? null;
  const buyer = buyers.find((row) => row.accessId === selected) ?? null;
  const options = buyers.filter((row) => row.open || row.accessId === selected).map((row) => ({ value: row.accessId, label: row.label }));

  useEffect(() => {
    if (initialTab === "questions") void markThreadReadAction(initialAccessId);
  }, [initialTab, initialAccessId]);
  const chat = thread?.messages.filter((message) => message.kind === "question") ?? [];
  const locked = <FichaLockedNote text={sellerCopy.processDeskLocked} />;

  function pickBuyer(next: string) {
    setSelected(next);
    // S41 (Alex): no page load; the address follows so a refresh or a shared link lands on the same buyer.
    window.history.replaceState(null, "", `/mi-empresa/procesos/${next}?pestana=${tab}`);
    if (tab === "questions") void markThreadReadAction(next);
  }

  return (
    <>
    <InvestorProjectTabs
      initialTab={initialTab}
      onTabChange={(next) => {
        setTab(next);
        window.history.replaceState(null, "", `/mi-empresa/procesos/${selected}?pestana=${next}`);
        if (next === "questions" && thread) void markThreadReadAction(thread.accessId);
      }}
      actions={
        // S41 (Alex): the buyer filter only on Chat / Documentos and Reuniones.
        tab !== "company" && options.length > 1 ? <BuyerFilter value={selected} options={options} onChange={pickBuyer} /> : null
      }
      panels={{
        company,
        questions:
          thread && thread.stage === "open" ? (
            <ProcessChatLayout
              chat={
                <ProjectThread
                  key={thread.accessId}
                  viewer="seller"
                  partyName={thread.partyName}
                  messages={chat}
                  action={postSellerMessageAction}
                  hidden={[
                    { name: "accessId", value: thread.accessId },
                    { name: "kind", value: "question" },
                  ]}
                  placeholder={sellerCopy.replyField}
                  submitLabel={sellerCopy.chatSend}
                  pendingLabel={sellerCopy.replying}
                  savedLabel={sellerCopy.replySaved}
                  invalidFallback={sellerCopy.replyInvalid}
                />
              }
              documents={
                <ProcessRoom
                  files={thread.documents}
                  bodies={chat.map((message) => message.body)}
                  nda
                  ndaHref={`/acuerdos/nda/${thread.accessId}`}
                  loiHref={thread.messages.some((message) => message.kind === "offer") ? `/acuerdos/loi/${thread.accessId}` : null}
                  contractHref={thread.contract?.signedHref ?? thread.contract?.current?.href ?? null}
                  contractSigned={Boolean(thread.contract?.signedHref)}
                  empty={sellerCopy.documentsEmpty}
                />
              }
            />
          ) : (
            locked
          ),
        meetings:
          thread && thread.stage === "open" ? (
            <MeetingDesk
              key={thread.accessId}
              messages={thread.messages}
              action={postSellerMessageAction}
              approveAction={approveSellerMeetingAction}
              rescheduleAction={rescheduleSellerMeetingAction}
              today={today}
              columns
              hidden={[
                { name: "accessId", value: thread.accessId },
                { name: "kind", value: "meeting" },
              ]}
            />
          ) : (
            locked
          ),
      }}
    />
    {buyer ? (
      <BuyerCardOverlay autoFold={tab !== "company"}>
        <BuyerCardSlider key={buyer.accessId} buyers={[{ id: buyer.accessId, label: buyer.label, card: buyer.card }]} />
      </BuyerCardOverlay>
    ) : null}
    </>
  );
}
