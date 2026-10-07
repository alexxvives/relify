"use client";

import { useActionState, useState } from "react";
import { useSessionChoice } from "@/components/session-flag";
import { Calendar, ChevronDown, Link2, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { acceptSellerBuyerAction, approveSellerMeetingAction, postSellerMessageAction, rescheduleSellerMeetingAction, updateSellerMeetingNotesAction } from "@/app/mi-empresa/procesos/actions";
import { DealPipeline, ProcessRoom } from "@/components/deal-pipeline";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { SellerTabs } from "@/components/seller-tabs";
import { billingCopy } from "@/lib/billing-copy";
import type { MessageCounts, SellerThread } from "@/lib/project-message";
import type { PendingMatch } from "@/lib/billing";
import { pendingActionsTitle, sellerCopy, threadMessageCount } from "@/lib/seller-copy";

const tabs = [
  { id: "summary", label: sellerCopy.summary },
  { id: "active", label: sellerCopy.active },
  { id: "inactive", label: sellerCopy.inactive },
] as const;

const counters = [
  { label: sellerCopy.accepted, icon: Link2 },
  { label: sellerCopy.questionsIn, icon: MessageCircleQuestion },
  { label: sellerCopy.questionsOut, icon: MessageCircle },
  { label: sellerCopy.meetingsDone, icon: Calendar },
] as const;

function SellerPending({ item }: { item: PendingMatch }) {
  const [state, action, pending] = useActionState(acceptSellerBuyerAction, null);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f8fb] px-3 py-3 text-left">
      <p className="text-sm font-medium">
        {item.label}
        <span className="ml-2 font-normal text-[#667085]">{item.codename}</span>
      </p>
      <form action={action}>
        <input type="hidden" name="accessId" value={item.accessId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-[#3d34b8] px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? billingCopy.acceptingBuyer : billingCopy.acceptBuyer}
        </button>
      </form>
      {state && !state.ok ? <p className="w-full text-sm text-red-700">{state.message}</p> : null}
      {state?.ok ? <p className="w-full text-sm text-[#157a45]">{billingCopy.buyerAccepted}</p> : null}
    </li>
  );
}

function ThreadList({
  threads,
  emptyTitle,
  emptyBody,
  today,
}: {
  threads: SellerThread[];
  emptyTitle: string;
  emptyBody: string;
  today: string;
}) {
  if (threads.length === 0) {
    return (
      <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <h2 className="text-lg font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-[#667085]">{emptyBody}</p>
      </section>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {threads.map((thread) => (
        <ThreadCard key={thread.accessId} thread={thread} today={today} />
      ))}
    </div>
  );
}

function ThreadCard({ thread, today }: { thread: SellerThread; today: string }) {
  const [open, setOpen] = useState(true);
  const chat = thread.messages.filter((message) => message.kind === "question");

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="flex w-full flex-col gap-4 px-5 py-4 text-left xl:flex-row xl:items-center"
      >
        <div className="flex min-w-0 items-start gap-3 xl:w-56">
          <ChevronDown className={open ? "mt-1 size-4 shrink-0 text-[#465ab4]" : "mt-1 size-4 shrink-0 -rotate-90 text-[#667085]"} aria-hidden />
          <span>
            <span className="block text-base font-semibold text-[#1c2740]">
              {thread.label}
              <span className="ml-2 text-sm font-normal text-[#667085]">{thread.codename}</span>
            </span>
            <span className="mt-1 block text-sm text-[#667085]">{threadMessageCount(thread.messages.length)}</span>
          </span>
        </div>
        <span className="min-w-0 flex-1">
          <DealPipeline steps={thread.steps} compact />
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-[#eef0f3] px-5 py-5">
          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-[#fbfbfc] p-5">
              <h3 className="text-sm font-semibold text-[#1c2740]">{sellerCopy.questionsPanel}</h3>
              <div className="mt-4 flex flex-1 flex-col">
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
              </div>
            </section>
            <ProcessRoom
              files={thread.documents}
              bodies={chat.map((message) => message.body)}
              nda
              empty={sellerCopy.documentsEmpty}
            />
          </div>
          <MeetingDesk
            messages={thread.messages}
            action={postSellerMessageAction}
            notesAction={updateSellerMeetingNotesAction}
            approveAction={approveSellerMeetingAction}
            rescheduleAction={rescheduleSellerMeetingAction}
            today={today}
            hidden={[
              { name: "accessId", value: thread.accessId },
              { name: "kind", value: "meeting" },
            ]}
          />
        </div>
      ) : null}
    </section>
  );
}

export function SellerProcesses({
  threads,
  counts,
  pendingMatches,
  today,
}: {
  threads: SellerThread[];
  counts: MessageCounts;
  pendingMatches: PendingMatch[];
  today: string;
}) {
  const [tab, setTab] = useSessionChoice(
    "releva:seller-process-tab",
    "summary",
    tabs.map((item) => item.id),
  );
  const counterValues = [counts.accepted, counts.questionsIn, counts.questionsOut, counts.meetings];

  return (
    <div>
      <SellerTabs label={sellerCopy.processesTitle} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "summary" ? (
        <div className="mt-4 flex flex-col gap-4">
          <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <h2 className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
            <p className="mt-1 text-sm text-[#667085]">{sellerCopy.activitySummaryIntro}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {counters.map((item, index) => (
                <li key={item.label} className="rounded-2xl border border-[#e7eaee] px-3 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-semibold text-[#2b3b4a]">{counterValues[index]}</p>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#64748b]">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-4 text-[#64748b]">{item.label}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
              <h2 className="text-lg font-semibold">{pendingActionsTitle(pendingMatches.length)}</h2>
              <p className="mt-1 text-sm text-[#667085]">{sellerCopy.pendingChatNote}</p>
              {pendingMatches.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {pendingMatches.map((item) => (
                    <SellerPending key={item.accessId} item={item} />
                  ))}
                </ul>
              ) : (
                <div className="mt-4">
                  <p className="text-sm font-semibold">{sellerCopy.pendingEmpty}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{sellerCopy.pendingBody}</p>
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
              <h2 className="text-lg font-semibold">{sellerCopy.meetingsTitle}</h2>
              <div className="mt-4">
                <p className="text-sm font-semibold">{sellerCopy.meetingsEmpty}</p>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{sellerCopy.meetingsEmptyBody}</p>
              </div>
            </section>
          </div>
        </div>
      ) : null}
      {tab === "active" ? (
        <ThreadList threads={threads} emptyTitle={sellerCopy.activeEmpty} emptyBody={sellerCopy.activeEmptyBody} today={today} />
      ) : null}
      {tab === "inactive" ? (
        <ThreadList threads={[]} emptyTitle={sellerCopy.inactiveEmpty} emptyBody={sellerCopy.inactiveEmptyBody} today={today} />
      ) : null}
    </div>
  );
}
