"use client";

import { useState } from "react";
import { useSessionChoice } from "@/components/session-flag";
import Link from "next/link";
import { approveInvestorMeetingAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { ProcessFichaLink } from "@/components/process-ficha-link";
import { DealPipeline, ProcessHeaderCue, ProcessRoom } from "@/components/deal-pipeline";
import { LiveRefresh } from "@/components/live-refresh";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { SellerTabs } from "@/components/seller-tabs";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { companyCopy } from "@/lib/company-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { investorCopy } from "@/lib/investor-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { DealStep } from "@/lib/deal-pipeline";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { InvestorProcessCard } from "@/server/investorDesk";

const processTabs = [
  { id: "chat", label: sellerCopy.questionsPanel },
  { id: "meetings", label: sellerCopy.meetingsHeading },
  { id: "advisor", label: "Asesor" },
] as const;

const pageTabs = [
  { id: "summary", label: sellerCopy.summary },
  { id: "active", label: sellerCopy.active },
] as const;

function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  return current?.id === "qa" || current?.id === "diligence";
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
  const [tab, setTab] = useState<(typeof processTabs)[number]["id"]>("chat");
  const chat = item.messages.filter((message) => message.kind === "question");

  return (
    <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
      <SellerTabs
        label={item.codename}
        tabs={processTabs}
        value={tab}
        onChange={setTab}
        disabled={item.advisorHired ? [] : ["advisor"]}
      />
      {item.nda ? null : (
        <p className="text-sm leading-6 text-[#5c6b78]">
          {item.sellerAccepted ? companyCopy.threadSignNda : companyCopy.threadWaiting}
        </p>
      )}
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
          <ProcessRoom files={item.documents} bodies={chat.map((message) => message.body)} nda empty={sellerCopy.documentsEmpty} />
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
  );
}

export function InvestorProcesses({
  items,
  buyerName,
  dateLabel,
  today,
  advisors = [],
}: {
  items: InvestorProcessCard[];
  buyerName: string;
  dateLabel: string;
  today: string;
  advisors?: AdvisorContactView[];
}) {
  const [page, setPage] = useSessionChoice(
    "releva:investor-process-tab",
    "active",
    pageTabs.map((item) => item.id),
  );
  const questions = items.reduce((sum, item) => sum + item.messages.filter((message) => message.kind === "question").length, 0);
  const meetings = items.reduce((sum, item) => sum + item.messages.filter((message) => message.kind === "meeting").length, 0);

  return (
    <div>
      <LiveRefresh />
      <SellerTabs label={investorCopy.processesTitle} tabs={pageTabs} value={page} onChange={setPage} />
      {page === "summary" ? (
        <section className="mt-4 rounded-2xl border border-[#e6e9f0] bg-white p-5">
          <h2 className="text-lg font-semibold">{sellerCopy.activitySummary}</h2>
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
        </section>
      ) : null}
      {page === "active" ? (
      <ul className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
                  diligence={{ accessId: item.accessId, advisorHref: `/asesoramiento?empresa=${item.slug}` }}
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
              <ProcessFichaLink href={`/proyectos/${item.slug}`} />
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
      </ul>
      ) : null}
    </div>
  );
}
