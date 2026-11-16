"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSessionString } from "@/components/shell/session-flag";
import { ChevronDown } from "lucide-react";
import {
  approveEngagementMeetingAction,
  deleteClientEngagementAction,
  postEngagementMessageAction,
  rescheduleEngagementMeetingAction,
} from "@/app/(app)/asesoramiento/thread-actions";
import { Trash2Icon } from "@/components/ui/trash-2";
import { ProcessRoom } from "@/components/investor/deal-pipeline";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { ProjectThread } from "@/components/investor/project-thread";
import { SellerTabs } from "@/components/seller/seller-tabs";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";

function ContactDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteClientEngagementAction, null);
  const [confirming, setConfirming] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirming) {
      return;
    }

    function cancel(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node) || !boxRef.current?.contains(target)) {
        setConfirming(false);
      }
    }

    document.addEventListener("click", cancel);
    return () => {
      document.removeEventListener("click", cancel);
    };
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={engagementCopy.removeAdvisor}
        onClick={() => {
          setConfirming(true);
        }}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#8b95a7] hover:bg-[#fff1f1] hover:text-red-700"
      >
        <Trash2Icon size={16} aria-hidden />
      </button>
    );
  }

  return (
    <div ref={boxRef} className="flex shrink-0 flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="engagementId" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center rounded-full bg-red-700 px-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? engagementCopy.removingAdvisor : engagementCopy.removeAdvisor}
        </button>
      </form>
      {state && !state.ok ? <p className="text-xs text-red-700">{state.message}</p> : null}
    </div>
  );
}

const contactTabs = [
  { id: "chat", label: engagementCopy.threadTitle },
  { id: "meetings", label: sellerCopy.meetingsHeading },
] as const;

function ContactPanels({
  contact,
  today,
  showDocuments,
  bare = false,
  meetings = true,
}: {
  contact: AdvisorContactView;
  today: string;
  showDocuments: boolean;
  bare?: boolean;
  meetings?: boolean;
}) {
  const [tab, setTab] = useState<(typeof contactTabs)[number]["id"]>("chat");
  const open = meetings ? tab : "chat";

  return (
    <div className={bare ? "flex flex-col gap-4 px-5 py-5" : "flex flex-col gap-4 border-t border-[#eef0f3] px-5 py-5"}>
      {meetings ? <SellerTabs label={contact.heading} tabs={contactTabs} value={tab} onChange={setTab} /> : null}
      {open === "chat" ? (
        <div className={showDocuments ? "grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "grid min-w-0"}>
          <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-[#fbfbfc] p-5">
            <div className="flex flex-1 flex-col">
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
      ) : (
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
      )}
    </div>
  );
}

export function AdvisorContactDesk({
  contacts,
  today,
  showDocuments = true,
  allowRemove = false,
  pinned = false,
  meetings = true,
}: {
  contacts: AdvisorContactView[];
  today: string;
  showDocuments?: boolean;
  allowRemove?: boolean;
  pinned?: boolean;
  meetings?: boolean;
}) {
  const [openId, setOpenId] = useSessionString("Relify:advisor-contact-open", contacts[0]?.id ?? "");

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
        const open = pinned || contact.id === openId;

        if (pinned) {
          return (
            <section key={contact.id} className="rounded-2xl border border-[#e6e9f0] bg-white">
              <ContactPanels contact={contact} today={today} showDocuments={showDocuments} bare meetings={meetings} />
            </section>
          );
        }

        return (
          <section key={contact.id} className="rounded-2xl border border-[#e6e9f0] bg-white">
            <div className="flex items-start gap-3 px-5 py-4">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => {
                  setOpenId(open ? "" : contact.id);
                }}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <ChevronDown className={open ? "mt-1 size-4 shrink-0 text-[#465ab4]" : "mt-1 size-4 shrink-0 -rotate-90 text-[#667085]"} aria-hidden />
                <span>
                  <span className="block text-base font-semibold text-[#1c2740]">{contact.heading}</span>
                  <span className="mt-1 block text-sm text-[#64748b]">{contact.detail}</span>
                  <span className="mt-1 block text-sm text-[#3d4a63]">{contact.services}</span>
                </span>
              </button>
              {allowRemove ? <ContactDelete id={contact.id} /> : null}
            </div>
            {open ? <ContactPanels contact={contact} today={today} showDocuments={showDocuments} meetings={meetings} /> : null}
          </section>
        );
      })}
    </div>
  );
}
