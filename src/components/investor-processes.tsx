"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { approveInvestorMeetingAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
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
import type { InvestorProcessCard } from "@/server/investorDesk";

const processTabs = [
  { id: "chat", label: sellerCopy.questionsPanel },
  { id: "meetings", label: sellerCopy.meetingsHeading },
] as const;

function wantsAdvisor(steps: readonly DealStep[]): boolean {
  const current = steps.find((step) => step.state === "current");
  return current?.id === "qa" || current?.id === "diligence";
}

function ProcessConversation({ item, today }: { item: InvestorProcessCard; today: string }) {
  const [tab, setTab] = useState<(typeof processTabs)[number]["id"]>("chat");
  const chat = item.messages.filter((message) => message.kind === "question");

  return (
    <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
      <SellerTabs
        label={item.codename}
        tabs={processTabs}
        value={tab}
        onChange={setTab}
      />
      {item.nda ? null : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm leading-6 text-[#5c6b78]">{companyCopy.threadLocked}</p>
          <Link href={`/proyectos/${item.slug}`} className="inline-flex h-11 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
            {companyCopy.threadLockedCta}
          </Link>
        </div>
      )}
      {tab === "chat" && item.nda ? (
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
}: {
  items: InvestorProcessCard[];
  buyerName: string;
  dateLabel: string;
  today: string;
}) {
  return (
    <div>
      <LiveRefresh />
      <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.slug}>
          <section className="flex flex-col gap-4 rounded-2xl border border-[#e7eaee] bg-white px-5 py-5">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
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
                <Link
                  href={`/proyectos/${item.slug}`}
                  className="ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#465ab4] px-4 text-sm font-semibold text-white"
                >
                  {investorCopy.openCompany}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
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
            <ProcessConversation item={item} today={today} />
          </section>
        </li>
      ))}
      </ul>
    </div>
  );
}
