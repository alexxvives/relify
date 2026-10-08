"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  approveEngagementMeetingAction,
  postEngagementMessageAction,
  rescheduleEngagementMeetingAction,
} from "@/app/asesoramiento/thread-actions";
import { ProcessRoom } from "@/components/deal-pipeline";
import { LiveRefresh } from "@/components/live-refresh";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";

export function AdvisorContactDesk({
  contacts,
  today,
  showDocuments = true,
}: {
  contacts: AdvisorContactView[];
  today: string;
  showDocuments?: boolean;
}) {
  const [openId, setOpenId] = useState(contacts[0]?.id ?? "");

  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d5dbe3] bg-[#fbfbfc] px-5 py-8">
        <p className="text-sm font-semibold text-[#1c2740]">{engagementCopy.contactsEmpty}</p>
        <p className="mt-2 text-sm leading-6 text-[#5c6b78]">{engagementCopy.contactsEmptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <LiveRefresh />
      {contacts.map((contact) => {
        const open = contact.id === openId;
        return (
          <section key={contact.id} className="rounded-2xl border border-[#e6e9f0] bg-white">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpenId(open ? "" : contact.id);
              }}
              className="flex w-full items-start gap-3 px-5 py-4 text-left"
            >
              <ChevronDown className={open ? "mt-1 size-4 shrink-0 text-[#465ab4]" : "mt-1 size-4 shrink-0 -rotate-90 text-[#667085]"} aria-hidden />
              <span>
                <span className="block text-base font-semibold text-[#1c2740]">{contact.heading}</span>
                <span className="mt-1 block text-sm text-[#64748b]">{contact.detail}</span>
                <span className="mt-1 block text-sm text-[#3d4a63]">{contact.services}</span>
              </span>
            </button>
            {open ? (
              <div className="flex flex-col gap-4 border-t border-[#eef0f3] px-5 py-5">
                <div className={showDocuments ? "grid items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "grid"}>
                  <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-[#fbfbfc] p-5">
                    <h3 className="text-sm font-semibold text-[#1c2740]">{engagementCopy.threadTitle}</h3>
                    <div className="mt-4 flex flex-1 flex-col">
                      <ProjectThread
                        viewer={contact.viewer}
                        partyName={contact.partyName}
                        messages={contact.messages.filter((message) => message.kind === "question")}
                        action={postEngagementMessageAction}
                        hidden={[
                          { name: "engagementId", value: contact.id },
                          { name: "kind", value: "question" },
                        ]}
                        placeholder={contact.placeholder}
                        submitLabel={sellerCopy.chatSend}
                        pendingLabel={sellerCopy.replying}
                        savedLabel={sellerCopy.replySaved}
                        invalidFallback={sellerCopy.replyInvalid}
                      />
                    </div>
                  </section>
                  {showDocuments ? (
                    <ProcessRoom
                      files={contact.documents}
                      bodies={contact.messages.map((message) => message.body)}
                      nda={false}
                      empty={engagementCopy.contactDocumentsEmpty}
                    />
                  ) : null}
                </div>
                <MeetingDesk
                  messages={contact.messages}
                  action={postEngagementMessageAction}
                  approveAction={approveEngagementMeetingAction}
                  rescheduleAction={rescheduleEngagementMeetingAction}
                  today={today}
                  hidden={[
                    { name: "engagementId", value: contact.id },
                    { name: "kind", value: "meeting" },
                  ]}
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
