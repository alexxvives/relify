"use client";

import { X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { acceptSellerBuyerAction } from "@/app/(app)/mi-empresa/procesos/actions";
import { ContractStage } from "@/components/investor/contract-stage";
import { AcceptLoiButton, DealPipeline, ProcessHeaderCue } from "@/components/investor/deal-pipeline";
import { CancelProcessButton } from "@/components/investor/cancel-process-button";
import { ProcessCardActions, ProcessCardHeader } from "@/components/investor/process-card-header";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { jumpToAnchor } from "@/components/shell/deep-link-marker";
import { InvestorPublicCard } from "@/components/investor/investor-public-card";
import { billingCopy } from "@/lib/billing-copy";
import type { InvestorPublicProfile, MessageCounts, SellerThread } from "@/lib/project-message";
import { unreadCount } from "@/lib/project-message";
import type { PendingMatch } from "@/lib/billing";
import { processTurnActions } from "@/lib/deal-pipeline";
import { pendingActionsTitle, sellerCopy, upcomingMeetingsTitle } from "@/lib/seller-copy";
import { Card } from "@/components/ui/form";

/** S42 (Alex): connection requests and per-process tasks share one row style in Acciones pendientes. */
/** S43: the in-page anchor of a process card (Acciones pendientes jumps to it). */
function processCardId(accessId: string): string {
  return `proceso-${accessId}`;
}

const pendingRowClass = "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6e9f0] bg-white px-3 py-2";
const pendingButtonClass =
  "inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#465ab4]";

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
      className={pendingButtonClass}
    >
      {sellerCopy.viewInvestor}
    </button>
  );

  return (
    <div className={named ? pendingRowClass : "flex flex-col items-stretch gap-2"}>
      {named ? (
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[#1c2740]">{item.label}</span>
          <span className="block text-sm text-[#5c6b78]">{sellerCopy.pendingRequestNote}</span>
        </span>
      ) : null}
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
  companyName = "",
  elsewhere = null,
}: {
  threads: SellerThread[];
  emptyTitle: string;
  emptyBody: string;
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
    <ThreadCard thread={thread} />
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

function ThreadCard({ thread }: { thread: SellerThread }) {
  // S40 (Alex): the conversations live in the process ficha. S43: the Asesor thread too (its own ficha tab).
  const chat = thread.messages.filter((message) => message.kind === "question");
  const unread = unreadCount(chat, thread.lastReadAt ?? null);
  const offer = thread.messages.find((message) => message.kind === "offer");
  const loiPending = thread.steps.some((step) => step.state === "current" && step.pendingLoi === true) && offer !== undefined;
  const fichaHref = `/mi-empresa/procesos/${thread.accessId}${unread > 0 ? "?pestana=buyers" : ""}`;
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
    <Card id={processCardId(thread.accessId)} className="flex scroll-mt-24 flex-col gap-4">
      <ProcessCardHeader
        title={
          <h2 className="text-lg font-semibold text-[#2b3b4a]">
            <span data-field-title>{thread.label}</span>
          </h2>
        }
        cue={
          <ProcessHeaderCue
            steps={thread.steps}
            role="seller"
            contractNext={thread.contract?.next ?? null}
            action={
              <>
                {loiPending && offer ? <AcceptLoiButton accessId={thread.accessId} body={offer.body} /> : null}
                {thread.contract ? <ContractStage contract={thread.contract} /> : null}
              </>
            }
          />
        }
        actions={
          <ProcessCardActions
            cancelAccessId={thread.contract?.stage === "signed" ? null : thread.accessId}
            fichaHref={fichaHref}
          />
        }
      />
      <DealPipeline steps={thread.steps} role="seller" hideAsideCue />
    </Card>
  );
}

export function SellerProcesses({
  threads,
  pendingMatches,
  companyName = "",
  elsewhere = null,
}: {
  threads: SellerThread[];
  counts: MessageCounts;
  pendingMatches: PendingMatch[];
  companyName?: string;
  elsewhere?: string | null;
}) {
  const turns = processTurnActions(threads, "seller");

  return (
    <div>
      <LiveRefresh />
      <div className="flex flex-col gap-4">
          <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold">{pendingActionsTitle(pendingMatches.length + turns.length)}</h2>
              {pendingMatches.length + turns.length > 0 ? (
                <ul className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto pr-1" data-pending-list>
                  {pendingMatches.map((item) => (
                    <li key={item.accessId}>
                      <SellerPending item={item} profile={threads.find((thread) => thread.accessId === item.accessId)?.profile ?? null} />
                    </li>
                  ))}
                  {/* S41 (Alex): each process's "Tu turno" action, linking to its ficha (S42: same row style). */}
                  {turns.map((turn) => (
                    <li key={`turn-${turn.accessId}`} className={pendingRowClass} data-turn-action>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#1c2740]">{turn.label}</span>
                        <span className="block text-sm text-[#5c6b78]">{turn.action}</span>
                      </span>
                      {/* S43 (Alex): scrolls to that process card here and marks its title (no page change). */}
                      <a
                        href={`/mi-empresa/procesos/${turn.accessId}`}
                        className={pendingButtonClass}
                        data-jump-process
                        onClick={(event) => {
                          if (jumpToAnchor(processCardId(turn.accessId))) event.preventDefault();
                        }}
                      >
                        {sellerCopy.openProcess}
                      </a>
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
          companyName={companyName}
          elsewhere={elsewhere}
        />
    </div>
  );
}
