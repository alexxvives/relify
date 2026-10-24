"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useSessionChoice } from "@/components/session-flag";
import { Calendar, Link2, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { acceptSellerBuyerAction, approveSellerMeetingAction, postSellerMessageAction, rescheduleSellerMeetingAction } from "@/app/mi-empresa/procesos/actions";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { CancelProcessButton } from "@/components/cancel-process-button";
import { DealPipeline, ProcessHeaderCue, ProcessRoom } from "@/components/deal-pipeline";
import { ProcessFichaLink } from "@/components/process-ficha-link";
import { LiveRefresh } from "@/components/live-refresh";
import { InvestorPublicCard } from "@/components/investor-public-card";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { SellerTabs } from "@/components/seller-tabs";
import { billingCopy } from "@/lib/billing-copy";
import type { InvestorPublicProfile, MessageCounts, SellerThread } from "@/lib/project-message";
import type { PendingMatch } from "@/lib/billing";
import { engagementCopy } from "@/lib/engagement-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { pendingActionsTitle, sellerCopy } from "@/lib/seller-copy";

const tabs = [
  { id: "summary", label: sellerCopy.summary },
  { id: "active", label: sellerCopy.active },
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
      <CancelProcessButton accessId={item.accessId} />
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
        accessId={item.accessId}
        action={action}
        pending={pending}
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
  advisors,
  companyName = "",
  elsewhere = null,
}: {
  threads: SellerThread[];
  emptyTitle: string;
  emptyBody: string;
  today: string;
  advisors: AdvisorContactView[];
  companyName?: string;
  elsewhere?: string | null;
}) {
  if (threads.length === 0) {
    const title = companyName.length > 0 ? sellerCopy.activeEmptyFor(companyName) : emptyTitle;
    const body = elsewhere ? sellerCopy.activeElsewhere(elsewhere) : emptyBody;

    return (
      <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-[#667085]">{body}</p>
      </section>
    );
  }

  return (
    <ul className="mt-4 flex flex-wrap items-start gap-4">
      {threads.map((thread) => (
        <li key={thread.accessId} className={thread.stage === "pending" ? "w-full max-w-sm" : "w-full"}>
          <ThreadCard thread={thread} today={today} advisors={advisors.filter((advisor) => advisor.slug === thread.slug)} />
        </li>
      ))}
    </ul>
  );
}

function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  // At diligence the header cue already carries "Contactar con un asesor".
  return current?.id === "qa";
}

function InvestorProfileDialog({
  label,
  profile,
  accessId,
  action,
  pending,
  open,
  onClose,
}: {
  label: string;
  profile: InvestorPublicProfile | null;
  accessId: string;
  action: (payload: FormData) => void;
  pending: boolean;
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
      className="fixed top-1/2 left-1/2 z-50 m-0 hidden w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 open:block backdrop:bg-[#1c2740]/40"
      onClose={onClose}
    >
      <InvestorPublicCard
        label={label}
        profile={profile}
        footer={
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <form action={action}>
              <input type="hidden" name="accessId" value={accessId} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-9 items-center rounded-full bg-[#1c2740] px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? billingCopy.acceptingBuyer : billingCopy.acceptBuyer}
              </button>
            </form>
            <form method="dialog">
              <button type="submit" className="inline-flex h-9 items-center rounded-full border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#1c2740]">
                {sellerCopy.closeProfile}
              </button>
            </form>
          </div>
        }
      />
    </dialog>
  );
}

function ThreadCard({ thread, today, advisors }: { thread: SellerThread; today: string; advisors: AdvisorContactView[] }) {
  const [desk, setDesk] = useState<"chat" | "meetings" | "advisor">("chat");
  const chat = thread.messages.filter((message) => message.kind === "question");
  const expandable = thread.stage === "open";

  if (thread.stage === "pending") {
    return (
      <InvestorPublicCard
        label={thread.label}
        profile={thread.profile}
        interest={thread.codename}
        footer={
          <div className="mt-4 flex flex-col gap-3">
            <SellerPending
              named={false}
              item={{ accessId: thread.accessId, codename: thread.codename, label: thread.label }}
              profile={thread.profile}
            />
          </div>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
      <div>
        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold text-[#2b3b4a]">{thread.label}</h2>
          <ProcessHeaderCue
            steps={thread.steps}
            role="seller"
            diligence={{ accessId: thread.accessId, advisorHref: `/mi-empresa/servicios?empresa=${thread.slug}` }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CancelProcessButton accessId={thread.accessId} />
          <ProcessFichaLink href={`/proyectos/${thread.slug}`} />
        </div>
        </div>
        {wantsAdvisor(thread.steps) ? (
          <Link
            href={`/mi-empresa/servicios?empresa=${thread.slug}`}
            className="inline-flex h-9 w-fit items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
          >
            {engagementCopy.contactAdvisor}
          </Link>
        ) : null}
      </div>
      <div>
          <DealPipeline
            steps={thread.steps}
            role="seller"
            hideAsideCue
            diligence={{ accessId: thread.accessId, advisorHref: `/mi-empresa/servicios?empresa=${thread.slug}` }}
            acceptLoi={
              thread.messages.some((message) => message.kind === "offer")
                ? {
                    accessId: thread.accessId,
                    body: thread.messages.find((message) => message.kind === "offer")?.body ?? "",
                  }
                : undefined
            }
          />
        </div>
      {expandable ? (
        <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
          <SellerTabs
            label={thread.codename}
            tabs={[
              { id: "chat", label: sellerCopy.questionsPanel },
              { id: "meetings", label: sellerCopy.meetingsHeading },
              { id: "advisor", label: "Asesor" },
            ]}
            value={desk}
            onChange={setDesk}
            disabled={thread.advisorHired ? [] : ["advisor"]}
          />
          {desk === "chat" ? (
            <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
                ndaHref={`/acuerdos/nda/${thread.accessId}`}
                loiHref={thread.messages.some((message) => message.kind === "offer") ? `/acuerdos/loi/${thread.accessId}` : null}
                empty={sellerCopy.documentsEmpty}
              />
            </div>
          ) : desk === "advisor" && thread.advisorHired ? (
            advisors.length > 0 ? (
              <AdvisorContactDesk contacts={advisors} today={today} pinned meetings={false} />
            ) : (
              <Link href={`/mi-empresa/servicios?empresa=${thread.slug}`} className="text-sm font-medium text-[#465ab4]">
                {engagementCopy.contactAdvisor}
              </Link>
            )
          ) : (
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
          )}
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
  advisors = [],
  companyName = "",
  elsewhere = null,
}: {
  threads: SellerThread[];
  counts: MessageCounts;
  pendingMatches: PendingMatch[];
  today: string;
  advisors?: AdvisorContactView[];
  companyName?: string;
  elsewhere?: string | null;
}) {
  const [tab, setTab] = useSessionChoice(
    "Relify:seller-process-tab",
    "active",
    tabs.map((item) => item.id),
  );
  const counterValues = [counts.accepted, counts.questionsIn, counts.questionsOut, counts.meetings];

  return (
    <div>
      <LiveRefresh />
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
          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
              <h2 className="text-lg font-semibold">{pendingActionsTitle(pendingMatches.length)}</h2>
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
        <ThreadList
          threads={threads}
          emptyTitle={sellerCopy.activeEmpty}
          emptyBody={sellerCopy.activeEmptyBody}
          today={today}
          advisors={advisors}
          companyName={companyName}
          elsewhere={elsewhere}
        />
      ) : null}
    </div>
  );
}
