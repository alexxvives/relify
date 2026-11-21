"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { approveSellerMeetingAction, postSellerMessageAction, rescheduleSellerMeetingAction } from "@/app/(app)/mi-empresa/procesos/actions";
import { markThreadReadAction } from "@/app/proyectos/[slug]/actions";
import { BuyerFilter } from "@/components/investor/buyer-filter";
import { ProcessRoom } from "@/components/investor/deal-pipeline";
import { InvestorProjectTabs, type ProcessTabId } from "@/components/investor/investor-project-tabs";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { ProcessChatLayout } from "@/components/investor/process-chat-layout";
import { ProjectThread } from "@/components/investor/project-thread";
import { FichaLockedNote } from "@/components/company/company-ficha-view";
import type { SellerThread } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";

/**
 * S40 (Alex): the seller's process ficha uses the buyer's tabs (Información de la empresa / Chat / Documentos /
 * Reuniones). With several buyers in process, the filter at the right of the tab row switches to another buyer's ficha.
 */
export function SellerProcessDesk({
  company,
  thread,
  buyers,
  today,
  initialTab,
}: {
  company: ReactNode;
  thread: SellerThread | null;
  buyers: { value: string; label: string }[];
  today: string;
  initialTab: ProcessTabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ProcessTabId>(initialTab);
  const accessId = thread?.accessId ?? null;

  useEffect(() => {
    if (initialTab === "questions" && accessId) void markThreadReadAction(accessId);
  }, [initialTab, accessId]);
  const chat = thread?.messages.filter((message) => message.kind === "question") ?? [];
  const locked = <FichaLockedNote text={sellerCopy.processDeskLocked} />;

  return (
    <InvestorProjectTabs
      key={thread?.accessId ?? "none"}
      initialTab={initialTab}
      onTabChange={(next) => {
        setTab(next);
        if (next === "questions" && thread) void markThreadReadAction(thread.accessId);
      }}
      actions={
        thread && buyers.length > 1 ? (
          <BuyerFilter
            value={thread.accessId}
            options={buyers}
            onChange={(next) => {
              router.push(`/mi-empresa/procesos/${next}?pestana=${tab}`);
            }}
          />
        ) : null
      }
      panels={{
        company,
        questions:
          thread && thread.stage === "open" ? (
            <ProcessChatLayout
              chat={
                <ProjectThread
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
  );
}
