"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { approveInvestorMeetingAction, markThreadReadAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { ClosedProcessRow, closedProcessRowClass } from "@/components/seller/sale-completed";
import { CancelProcessButton } from "@/components/investor/cancel-process-button";
import { ProcessFichaLink } from "@/components/investor/process-ficha-link";
import { ContractStage } from "@/components/investor/contract-stage";
import { DealPipeline, ProcessHeaderCue, ProcessRoom } from "@/components/investor/deal-pipeline";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { ProjectThread } from "@/components/investor/project-thread";
import { DeskToggles } from "@/components/shell/desk-toggles";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { companyCopy } from "@/lib/company-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { InvestorProcessCard } from "@/lib/server/investor-desk";
import { unreadCount } from "@/lib/project-message";
import type { CancelledProcess } from "@/lib/server/investor-desk";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/form";

const processTabs = [
  { id: "chat", label: sellerCopy.questionsPanel },
  { id: "meetings", label: sellerCopy.meetingsHeading },
  { id: "advisor", label: "Asesor" },
] as const;


function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  // S28/S29b (Alex): from Preguntas through Contrato the asesor link lives in the bottom-right action row.
  return current?.id === "qa" || current?.id === "loi" || current?.id === "documents";
}

function ProcessConversation({
  item,
  today,
  advisors,
  actions = null,
}: {
  item: InvestorProcessCard;
  today: string;
  advisors: AdvisorContactView[];
  /** Alex (S25): "Cancelar proceso" and "Ver la ficha" at the far right of the toggles row. */
  actions?: ReactNode;
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
      <div className="flex flex-wrap items-center gap-3">
        <DeskToggles
          label={item.codename}
          controls={deskId}
          tabs={processTabs
            .filter((entry) => entry.id !== "advisor" || item.advisorHired)
            .map((entry) => (entry.id === "chat" ? { ...entry, count: unread } : entry))}
          value={tab}
          onChange={changeTab}
          disabled={item.nda ? [] : (["chat", "meetings"] as const)}
          hints={{
            ...(item.nda
              ? {}
              : {
                  chat: item.sellerAccepted ? companyCopy.threadSignNda : companyCopy.threadWaiting,
                  meetings: item.sellerAccepted ? companyCopy.threadSignNda : companyCopy.threadWaiting,
                }),
          }}
        />
        {/* Mis procesos layout rule: one action row, toggles on the left; Cancelar proceso, Ver la ficha and (from Q&A
            through Contrato) Contacta con un asesor on the right. */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {actions}
          {!item.advisorHired && wantsAdvisor(item.steps) ? (
            <Link
              href={`/asesoramiento?empresa=${item.slug}`}
              data-advisor-link
              className="inline-flex h-9 w-fit items-center rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium whitespace-nowrap text-[#465ab4]"
            >
              {engagementCopy.contactAdvisor}
            </Link>
          ) : null}
        </div>
      </div>
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

  return (
    <div>
      <LiveRefresh />
      {items.length > 0 ? <h2 className="text-lg font-semibold text-[#2b3b4a]">{sellerCopy.active}</h2> : null}
      <ul className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
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
              </div>
              {item.contract ? (
                <div className="flex shrink-0 items-center gap-2">
                  <ContractStage contract={item.contract} />
                </div>
              ) : null}
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
            />
            <ProcessConversation
              item={item}
              today={today}
              advisors={advisors.filter((advisor) => advisor.slug === item.slug)}
              actions={
                <>
                  {item.contract?.stage === "signed" ? null : <CancelProcessButton accessId={item.accessId} />}
                  <ProcessFichaLink href={`/proyectos/${item.slug}`} />
                </>
              }
            />
          </Card>
        </li>
      ))}
      </ul>
      
      {/* t92: "Procesos cerrados" gathers cancelled and finished (closed) processes in one collapsed row. */}
      {cancelled.length > 0 || closed.length > 0 ? (
        <div className="mt-4">
          <CancelledList items={cancelled} extra={closed.length}>
            {closed.map((item) =>
              item.closed ? (
                <li key={item.slug} className="py-2">
                  <ClosedProcessRow codename={item.codename} slug={item.slug} closed={item.closed} contractHref={item.contract?.signedHref ?? null} />
                </li>
              ) : null,
            )}
          </CancelledList>
        </div>
      ) : null}
    </div>
  );
}

/** Closed processes stay reachable (read-only, via the ficha) instead of silently disappearing. */
export function CancelledList({ items, extra = 0, children }: { items: CancelledProcess[]; extra?: number; children?: ReactNode }) {
  return (
    <details className="group/cancel rounded-xl border border-[#e7eaee] bg-[#fafbfd] px-4 py-2 open:pb-3">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded text-sm font-medium text-[#5c6b78] hover:text-[#1c2740] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        Procesos cerrados · {items.length + extra}
        <ChevronDown className="size-4 shrink-0 text-[#64748b] transition-transform group-open/cancel:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-2 flex flex-col">
        {children}
        {items.map((item) => (
          <li key={item.accessId} className="py-2">
            {/* t94: same muted card as a sold/finished process (ClosedProcessRow). */}
            <div className={closedProcessRowClass}>
              <span className="min-w-0 font-semibold text-[#2b3b4a] sm:flex-1 sm:truncate">{item.codename}</span>
              <span className="shrink-0 sm:w-48">
                <span className="inline-flex w-fit items-center rounded-full bg-[#f2f4f7] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-[#475467]">Cancelado</span>
              </span>
              <span className="shrink-0 text-[#667085] tabular-nums whitespace-nowrap sm:w-56">
                {new Date(item.cancelledAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" })}
              </span>
              <span className="flex shrink-0 items-center justify-end sm:w-64">
                <Link href={`/proyectos/${item.slug}`} className="font-medium text-[#465ab4]">
                  Ver ficha
                </Link>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
