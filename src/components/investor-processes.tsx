"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { approveInvestorMeetingAction, markThreadReadAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { ClosedProcessRow } from "@/components/sale-completed";
import { CancelProcessButton } from "@/components/cancel-process-button";
import { ProcessFichaLink } from "@/components/process-ficha-link";
import { ContractStage } from "@/components/contract-stage";
import { DealPipeline, ProcessHeaderCue, ProcessRoom } from "@/components/deal-pipeline";
import { LiveRefresh } from "@/components/live-refresh";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { DeskToggles } from "@/components/desk-toggles";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { companyCopy } from "@/lib/company-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { InvestorProcessCard } from "@/server/investorDesk";
import { unreadCount } from "@/lib/project-message";
import type { CancelledProcess } from "@/server/investorDesk";
import { ChevronDown } from "lucide-react";

const processTabs = [
  { id: "chat", label: sellerCopy.questionsPanel },
  { id: "meetings", label: sellerCopy.meetingsHeading },
  { id: "advisor", label: "Asesor" },
] as const;


function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  // At diligence the header cue already carries "Contactar con un asesor".
  return current?.id === "qa";
}

function ProcessConversation({
  item,
  today,
  advisors,
}: {
  item: InvestorProcessCard;
  today: string;
  advisors: AdvisorContactView[];
}) {
  const [tab, setTab] = useState<(typeof processTabs)[number]["id"] | null>(null);
  const chat = item.messages.filter((message) => message.kind === "question");
  const deskId = useId();
  const [readAt, setReadAt] = useState(item.lastReadAt);
  const unread = tab === "chat" ? 0 : unreadCount(chat, readAt);

  function changeTab(next: (typeof processTabs)[number]["id"] | null) {
    if (next === "chat" || tab === "chat") {
      setReadAt(new Date().toISOString());
      void markThreadReadAction(item.accessId);
    }
    setTab(next);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
      <DeskToggles
        label={item.codename}
        controls={deskId}
        tabs={processTabs.map((entry) => (entry.id === "chat" ? { ...entry, count: unread } : entry))}
        value={tab}
        onChange={changeTab}
        disabled={[...(item.nda ? [] : (["chat", "meetings"] as const)), ...(item.advisorHired ? [] : (["advisor"] as const))]}
        hints={
          item.nda
            ? {}
            : {
                chat: item.sellerAccepted ? companyCopy.threadSignNda : companyCopy.threadWaiting,
                meetings: item.sellerAccepted ? companyCopy.threadSignNda : companyCopy.threadWaiting,
              }
        }
      />
      <div id={deskId} hidden={tab === null} className="flex flex-col gap-4">
      {tab === "chat" && item.nda ? (
        <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-[#fbfbfc] p-5">
            <ProjectThread
              viewer="investor"
              partyName={item.partyName}
              messages={chat}
              action={postInvestorMessageAction}
              hidden={[
                { name: "slug", value: item.slug },
                { name: "kind", value: "question" },
              ]}
              placeholder={companyCopy.questionPrompt}
              submitLabel={companyCopy.sendMessage}
              pendingLabel={companyCopy.sending}
              savedLabel={companyCopy.messageSent}
              invalidFallback={companyCopy.messageInvalid}
            />
          </section>
          <ProcessRoom
            files={item.documents}
            bodies={chat.map((message) => message.body)}
            nda
            ndaHref={item.nda ? `/acuerdos/nda/${item.accessId}` : null}
            loiHref={item.messages.some((message) => message.kind === "offer") ? `/acuerdos/loi/${item.accessId}` : null}
            contractHref={item.contract?.signedHref ?? item.contract?.current?.href ?? null}
            contractSigned={Boolean(item.contract?.signedHref)}
            empty={sellerCopy.documentsEmpty}
          />
        </div>
      ) : null}
      {tab === "advisor" && item.advisorHired ? (
        advisors.length > 0 ? (
          <AdvisorContactDesk contacts={advisors} today={today} pinned meetings={false} />
        ) : (
          <Link href={`/asesoramiento?empresa=${item.slug}`} className="text-sm font-medium text-[#465ab4]">
            {engagementCopy.contactAdvisor}
          </Link>
        )
      ) : null}
      {tab === "meetings" && item.nda ? (
        <MeetingDesk
          messages={item.messages}
          action={postInvestorMessageAction}
          approveAction={approveInvestorMeetingAction}
          rescheduleAction={rescheduleInvestorMeetingAction}
          today={today}
          columns
          hidden={[
            { name: "slug", value: item.slug },
            { name: "kind", value: "meeting" },
          ]}
        />
      ) : null}
      </div>
    </div>
  );
}

export function InvestorProcesses({
  items,
  buyerName,
  dateLabel,
  today,
  advisors = [],
  cancelled = [],
}: {
  cancelled?: CancelledProcess[];
  items: InvestorProcessCard[];
  buyerName: string;
  dateLabel: string;
  today: string;
  advisors?: AdvisorContactView[];
}) {
  const closed = items.filter((item) => item.closed !== null);
  items = items.filter((item) => item.closed === null);
  const questions = items.reduce((sum, item) => sum + item.messages.filter((message) => message.kind === "question").length, 0);
  const meetings = items.reduce((sum, item) => sum + item.messages.filter((message) => message.kind === "meeting").length, 0);

  return (
    <div>
      <LiveRefresh />
      <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5" aria-labelledby="processes-summary">
          <h2 id="processes-summary" className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <li className="rounded-2xl border border-[#e7eaee] px-3 py-4">
              <p className="text-2xl font-semibold text-[#2b3b4a]">{items.length}</p>
              <p className="mt-3 text-xs text-[#64748b]">{sellerCopy.active}</p>
            </li>
            <li className="rounded-2xl border border-[#e7eaee] px-3 py-4">
              <p className="text-2xl font-semibold text-[#2b3b4a]">{items.filter((item) => item.nda).length}</p>
              <p className="mt-3 text-xs text-[#64748b]">NDA</p>
            </li>
            <li className="rounded-2xl border border-[#e7eaee] px-3 py-4">
              <p className="text-2xl font-semibold text-[#2b3b4a]">{questions}</p>
              <p className="mt-3 text-xs text-[#64748b]">{sellerCopy.questionsIn}</p>
            </li>
            <li className="rounded-2xl border border-[#e7eaee] px-3 py-4">
              <p className="text-2xl font-semibold text-[#2b3b4a]">{meetings}</p>
              <p className="mt-3 text-xs text-[#64748b]">{sellerCopy.meetingsDone}</p>
            </li>
          </ul>
          {cancelled.length > 0 ? (
            <div className="mt-4">
              <CancelledList items={cancelled} />
            </div>
          ) : null}
        </section>
      {items.length > 0 ? <h2 className="mt-6 text-lg font-semibold text-[#2b3b4a]">{sellerCopy.active}</h2> : null}
      <ul className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
            <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
                  diligence={{ accessId: item.accessId, advisorHref: `/asesoramiento?empresa=${item.slug}` }}
                  contractNext={item.contract?.next ?? null}
                  sign={{
                    slug: item.slug,
                    nda: ndaAgreement({
                      buyerName,
                      codename: item.codename,
                      region: item.region,
                      dateLabel,
                    }),
                    loi: loiAgreement({
                      buyerName,
                      codename: item.codename,
                      region: item.region,
                      askingPrice: item.askingPrice,
                      dateLabel,
                    }),
                  }}
                />
                {wantsAdvisor(item.steps) ? (
                  <Link
                    href={`/asesoramiento?empresa=${item.slug}`}
                    className="inline-flex h-9 items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4]"
                  >
                    {engagementCopy.contactAdvisor}
                  </Link>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.contract ? <ContractStage contract={item.contract} /> : null}
                {item.contract?.stage === "signed" ? null : <CancelProcessButton accessId={item.accessId} />}
                <ProcessFichaLink href={`/proyectos/${item.slug}`} />
              </div>
            </div>
            <DealPipeline
              steps={item.steps}
              role="investor"
              hideAsideCue
              sign={{
                slug: item.slug,
                nda: ndaAgreement({
                  buyerName,
                  codename: item.codename,
                  region: item.region,
                  dateLabel,
                }),
                loi: loiAgreement({
                  buyerName,
                  codename: item.codename,
                  region: item.region,
                  askingPrice: item.askingPrice,
                  dateLabel,
                }),
              }}
              diligence={{ accessId: item.accessId, advisorHref: `/asesoramiento?empresa=${item.slug}` }}
            />
            <ProcessConversation item={item} today={today} advisors={advisors.filter((advisor) => advisor.slug === item.slug)} />
          </section>
        </li>
      ))}
      {closed.map((item) =>
        item.closed ? (
          <li key={item.slug}>
            <ClosedProcessRow
              codename={item.codename}
              slug={item.slug}
              closed={item.closed}
              contractHref={item.contract?.signedHref ?? null}
            />
          </li>
        ) : null,
      )}
      </ul>
    </div>
  );
}

/** Closed processes stay reachable (read-only, via the ficha) instead of silently disappearing. */
export function CancelledList({ items }: { items: CancelledProcess[] }) {
  return (
    <details className="group/cancel rounded-xl border border-[#e7eaee] bg-[#fafbfd] px-4 py-2 open:pb-3">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#2b3b4a] [&::-webkit-details-marker]:hidden">
        Procesos cancelados ({items.length})
        <ChevronDown className="size-4 shrink-0 text-[#64748b] transition-transform group-open/cancel:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-2 flex flex-col divide-y divide-[#eceff4]">
        {items.map((item) => (
          <li key={item.accessId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <Link href={`/proyectos/${item.slug}`} className="min-w-0 truncate font-medium text-[#465ab4] hover:underline">
              {item.codename}
            </Link>
            <span className="shrink-0 text-[#64748b]">
              Cancelado el {new Date(item.cancelledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
