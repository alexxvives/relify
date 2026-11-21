"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useId } from "react";
import { acceptSellerBuyerAction } from "@/app/(app)/mi-empresa/procesos/actions";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { CancelProcessButton } from "@/components/investor/cancel-process-button";
import { ContractStage } from "@/components/investor/contract-stage";
import { AcceptLoiButton, DealPipeline, ProcessHeaderCue } from "@/components/investor/deal-pipeline";
import { ProcessFichaLink } from "@/components/investor/process-ficha-link";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { InvestorPublicCard } from "@/components/investor/investor-public-card";
import { DeskToggles } from "@/components/shell/desk-toggles";
import { billingCopy } from "@/lib/billing-copy";
import type { InvestorPublicProfile, MessageCounts, SellerThread } from "@/lib/project-message";
import { unreadCount } from "@/lib/project-message";
import type { PendingMatch } from "@/lib/billing";
import { engagementCopy } from "@/lib/engagement-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import { pendingActionsTitle, sellerCopy, upcomingMeetingsTitle } from "@/lib/seller-copy";
import { Card } from "@/components/ui/form";

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
    <button
      type="button"
      onClick={() => {
        setProfileOpen(true);
      }}
      className="inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#465ab4]"
    >
      {sellerCopy.viewInvestor}
    </button>
  );

  return (
    <div className={named ? "flex flex-wrap items-center justify-between gap-3" : "flex flex-col items-stretch gap-2"}>
      {named ? <p className="text-sm font-medium text-[#1c2740]">{item.label}</p> : null}
      {buttons}
      {state && !state.ok ? <p className="w-full text-sm text-red-700">{state.message}</p> : null}
      {pending ? <p className="w-full text-sm text-[#465ab4]" role="status">{billingCopy.acceptingBuyer}</p> : null}
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
  // Investors still waiting for an answer live only in Acciones pendientes (Ver perfil → Aceptar / Rechazar).
  const open = threads.filter((thread) => thread.stage !== "pending");

  if (open.length === 0) {
    const title = companyName.length > 0 ? sellerCopy.activeEmptyFor(companyName) : emptyTitle;
    const body = elsewhere ? sellerCopy.activeElsewhere(elsewhere) : emptyBody;

    return (
      <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-[#667085]">{body}</p>
      </section>
    );
  }

  const card = (thread: SellerThread) => (
    <ThreadCard thread={thread} today={today} advisors={advisors.filter((advisor) => advisor.slug === thread.slug)} />
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {open.map((thread) => (
          <li key={thread.accessId}>{card(thread)}</li>
        ))}
      </ul>
    </div>
  );
}

function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  // S28/S29b (Alex): from Preguntas through Contrato the asesor link lives in the bottom-right action row.
  return current?.id === "qa" || current?.id === "loi" || current?.id === "documents";
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
      <form method="dialog" className="absolute top-3 right-3 z-10">
        <button type="submit" aria-label={sellerCopy.closeProfile} className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
          <X className="size-4" aria-hidden />
        </button>
      </form>
      <InvestorPublicCard
        label={label}
        profile={profile}
        footer={
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <CancelProcessButton accessId={accessId} label={sellerCopy.rejectInvestor} />
            {/* Close the card on submit and show progress in the row: the server round trip plus the
                refreshed page take ~1 s on Workers, which felt like a frozen button (Alex, t50). */}
            <form
              action={action}
              onSubmit={(event) => {
                event.currentTarget.closest("dialog")?.close();
              }}
            >
              <input type="hidden" name="accessId" value={accessId} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-9 items-center rounded-full bg-[#1c2740] px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? billingCopy.acceptingBuyer : billingCopy.acceptBuyer}
              </button>
            </form>
          </div>
        }
      />
    </dialog>
  );
}

function ThreadCard({ thread, today, advisors }: { thread: SellerThread; today: string; advisors: AdvisorContactView[] }) {
  // S40 (Alex): Chat / Documentos and Reuniones moved to the process ficha as tabs; only the Asesor desk stays here.
  const [desk, setDesk] = useState<"advisor" | null>(null);
  const deskId = useId();
  const chat = thread.messages.filter((message) => message.kind === "question");
  const unread = unreadCount(chat, thread.lastReadAt ?? null);
  const offer = thread.messages.find((message) => message.kind === "offer");
  const loiPending = thread.steps.some((step) => step.state === "current" && step.pendingLoi === true) && offer !== undefined;
  const expandable = thread.stage === "open";
  const processActions = (
    <>
      {thread.contract?.stage === "signed" ? null : <CancelProcessButton accessId={thread.accessId} />}
      <ProcessFichaLink href={`/mi-empresa/procesos/${thread.accessId}${unread > 0 ? "?pestana=questions" : ""}`} unread={unread} />
    </>
  );

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
    <Card className="flex flex-col gap-4">
      <div>
        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold text-[#2b3b4a]">{thread.label}</h2>
          <ProcessHeaderCue
            steps={thread.steps}
            role="seller"
            contractNext={thread.contract?.next ?? null}
          />
        </div>
        {(thread.contract && thread.contract.stage !== "signed") || !expandable || loiPending ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {loiPending && offer ? <AcceptLoiButton accessId={thread.accessId} body={offer.body} /> : null}
            {thread.contract && (thread.contract.stage !== "signed" || !expandable) ? <ContractStage contract={thread.contract} /> : null}
            {expandable ? null : processActions}
          </div>
        ) : null}
        </div>
      </div>
      <div>
          <DealPipeline
            steps={thread.steps}
            role="seller"
            hideAsideCue
          />
        </div>
      {expandable ? (
        <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          {thread.advisorHired ? (
            <DeskToggles
              label={thread.codename}
              controls={deskId}
              tabs={[{ id: "advisor" as const, label: "Asesor" }]}
              value={desk}
              onChange={setDesk}
            />
          ) : null}
          {/* Alex (t50/S28): "Ver ficha", "Cancelar proceso" and, from Preguntas through Contrato, "Contacta con un asesor" sit at
              the far right of the panel toggles (with the signed-contract record, when there is one). */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {thread.contract?.stage === "signed" ? <ContractStage contract={thread.contract} /> : null}
            {processActions}
            {!thread.advisorHired && wantsAdvisor(thread.steps) ? (
              <Link
                href={`/mi-empresa/servicios?empresa=${thread.slug}`}
                data-advisor-link
                className="inline-flex h-9 w-fit items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#465ab4]"
              >
                {engagementCopy.contactAdvisor}
              </Link>
            ) : null}
          </div>
          </div>
          <div id={deskId} hidden={desk === null}>
          {desk === "advisor" && thread.advisorHired ? (
            advisors.length > 0 ? (
              <AdvisorContactDesk contacts={advisors} today={today} pinned meetings={false} />
            ) : (
              <Link href={`/mi-empresa/servicios?empresa=${thread.slug}`} className="text-sm font-medium text-[#465ab4]">
                {engagementCopy.contactAdvisor}
              </Link>
            )
          ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function SellerProcesses({
  threads,
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
  return (
    <div>
      <LiveRefresh />
      <div className="flex flex-col gap-4">
          <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
            <Card>
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
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">{upcomingMeetingsTitle(0)}</h2>
              <div className="mt-4">
                <p className="text-sm font-semibold">{sellerCopy.meetingsEmpty}</p>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{sellerCopy.meetingsEmptyBody}</p>
              </div>
            </Card>
          </div>
      </div>
      <h2 className="mt-6 mb-3 text-lg font-semibold text-[#2b3b4a]">{sellerCopy.active}</h2>
        <ThreadList
          threads={threads}
          emptyTitle={sellerCopy.activeEmpty}
          emptyBody={sellerCopy.activeEmptyBody}
          today={today}
          advisors={advisors}
          companyName={companyName}
          elsewhere={elsewhere}
        />
    </div>
  );
}
