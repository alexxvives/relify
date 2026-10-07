"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSessionChoice, useSessionFlag } from "@/components/session-flag";
import { Calendar, ChevronDown, Link2, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { acceptSellerBuyerAction, approveSellerMeetingAction, postSellerMessageAction, rescheduleSellerMeetingAction } from "@/app/mi-empresa/procesos/actions";
import { DealPipeline, ProcessRoom } from "@/components/deal-pipeline";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { SellerTabs } from "@/components/seller-tabs";
import { billingCopy } from "@/lib/billing-copy";
import type { InvestorPublicProfile, MessageCounts, SellerThread } from "@/lib/project-message";
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

function SellerPending({
  item,
  profile,
  named = true,
}: {
  item: PendingMatch;
  profile: InvestorPublicProfile | null;
  named?: boolean;
}) {
  const [state, action, pending] = useActionState(acceptSellerBuyerAction, null);
  const [profileOpen, setProfileOpen] = useState(false);
  const buttons = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setProfileOpen(true);
        }}
        className="inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
      >
        {sellerCopy.viewInvestor}
      </button>
      <form action={action}>
        <input type="hidden" name="accessId" value={item.accessId} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-[#1c2740] px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? billingCopy.acceptingBuyer : billingCopy.acceptBuyer}
        </button>
      </form>
    </div>
  );

  return (
    <div className={named ? "flex flex-wrap items-center justify-between gap-3" : "flex flex-col items-end gap-2"}>
      {named ? <p className="text-sm font-medium text-[#1c2740]">{item.label}</p> : null}
      {buttons}
      {state && !state.ok ? <p className="w-full text-sm text-red-700">{state.message}</p> : null}
      {state?.ok ? <p className="w-full text-sm text-[#157a45]">{billingCopy.buyerAccepted}</p> : null}
      <InvestorProfileDialog
        label={item.label}
        profile={profile}
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
        }}
      />
    </div>
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

function InvestorProfileDialog({
  label,
  profile,
  open,
  onClose,
}: {
  label: string;
  profile: InvestorPublicProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!open || !dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#e7eaee] bg-white p-0 text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <div className="bg-[#1c2740] px-6 pt-5 pb-14">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">Perfil del inversor</p>
      </div>
      <div className="-mt-10 px-6 pb-6">
        <ProfilePhoto photo={profile?.photo ?? ""} />
        <h2 className="mt-3 text-xl font-semibold">{label}</h2>
        {profile?.place ? <p className="mt-1 text-sm text-[#5c6b78]">{profile.place}</p> : null}
        {profile ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <ProfileFact label={sellerCopy.investorTypeLabel} value={profile.investorType} />
              <ProfileFact label={sellerCopy.investorTicketLabel} value={profile.ticket} />
              <ProfileFact label={sellerCopy.investorSectorsLabel} value={profile.sectors} />
              <ProfileFact label={sellerCopy.investorPlaceLabel} value={profile.place} />
            </dl>
            <p className="mt-5 text-xs font-semibold tracking-wide text-[#667085] uppercase">{sellerCopy.investorThesisLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{profile.thesis}</p>
            <p className="mt-4 text-xs font-semibold tracking-wide text-[#667085] uppercase">{sellerCopy.investorOfferLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{profile.contribution}</p>
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#667085]">{sellerCopy.investorProfileEmpty}</p>
        )}
        <form method="dialog" className="mt-5">
          <button type="submit" className="inline-flex h-9 items-center rounded-full bg-[#1c2740] px-3 text-sm font-medium text-white">
            {sellerCopy.closeProfile}
          </button>
        </form>
      </div>
    </dialog>
  );
}

function ProfilePhoto({ photo }: { photo: string }) {
  if (photo.length === 0) {
    return <span className="inline-flex size-20 items-center justify-center rounded-full border-4 border-white bg-[#e7edf8] text-sm font-semibold text-[#1c2740]">I</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className="size-20 rounded-full border-4 border-white object-cover" />
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f8fb] px-3 py-3">
      <dt className="text-[11px] font-semibold tracking-wide text-[#667085] uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1c2740]">{value.length > 0 ? value : "—"}</dd>
    </div>
  );
}

function ThreadCard({ thread, today }: { thread: SellerThread; today: string }) {
  const [open, setOpen] = useSessionFlag(`releva:seller-thread:${thread.accessId}`, true);
  const chat = thread.messages.filter((message) => message.kind === "question");
  const expandable = thread.stage === "open";
  const subtitle = thread.stage === "open" ? threadMessageCount(thread.messages.length) : "";

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
          className="flex w-full items-start gap-3 px-5 pt-4 text-left"
        >
          <ChevronDown className={open ? "mt-1 size-4 shrink-0 text-[#465ab4]" : "mt-1 size-4 shrink-0 -rotate-90 text-[#667085]"} aria-hidden />
          <span>
            <span className="block text-base font-semibold text-[#1c2740]">{thread.label}</span>
            {subtitle ? <span className="mt-1 block text-sm text-[#667085]">{subtitle}</span> : null}
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
          <div>
            <p className="text-base font-semibold text-[#1c2740]">{thread.label}</p>
            {subtitle ? <p className="mt-1 text-sm text-[#667085]">{subtitle}</p> : null}
          </div>
          {thread.stage === "pending" ? (
            <SellerPending
              named={false}
              item={{ accessId: thread.accessId, codename: thread.codename, label: thread.label }}
              profile={thread.profile}
            />
          ) : null}
        </div>
      )}
      {thread.stage === "pending" ? null : (
        <div className="px-5 pb-4">
          <DealPipeline steps={thread.steps} role="seller" diligence={{ accessId: thread.accessId, advisorHref: "/mi-empresa/servicios" }} />
        </div>
      )}
      {expandable && open ? (
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
                    <li key={item.accessId}>
                      <SellerPending item={item} profile={threads.find((thread) => thread.accessId === item.accessId)?.profile ?? null} />
                    </li>
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
