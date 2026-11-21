"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { ClosedProcessRow, closedProcessRowClass } from "@/components/seller/sale-completed";
import { ProcessCardActions, ProcessCardHeader } from "@/components/investor/process-card-header";
import { ContractStage } from "@/components/investor/contract-stage";
import { DealPipeline, ProcessHeaderCue } from "@/components/investor/deal-pipeline";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { DeskToggles } from "@/components/shell/desk-toggles";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { InvestorProcessCard } from "@/lib/server/investor-desk";
import { unreadCount } from "@/lib/project-message";
import type { CancelledProcess } from "@/lib/server/investor-desk";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/form";

/** S41 (Alex): Chat / Documentos and Reuniones live in the ficha tabs; the card keeps only the Asesor desk. */
function AdvisorDesk({ item, today, advisors }: { item: InvestorProcessCard; today: string; advisors: AdvisorContactView[] }) {
  const [tab, setTab] = useState<"advisor" | null>(null);
  const deskId = useId();

  return (
    <div className="flex flex-col gap-4 border-t border-[#eef0f3] pt-4">
      <DeskToggles label={item.codename} controls={deskId} tabs={[{ id: "advisor" as const, label: "Asesor" }]} value={tab} onChange={setTab} />
      <div id={deskId} hidden={tab === null}>
        {tab === "advisor" ? (
          advisors.length > 0 ? (
            <AdvisorContactDesk contacts={advisors} today={today} pinned meetings={false} />
          ) : (
            <Link href={`/asesoramiento?empresa=${item.slug}`} className="text-sm font-medium text-[#465ab4]">
              {engagementCopy.contactAdvisor}
            </Link>
          )
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
            <ProcessCardHeader
              title={<h2 className="text-lg font-semibold text-[#2b3b4a]">{item.codename}</h2>}
              cue={
                <ProcessHeaderCue
                  steps={item.steps}
                  role="investor"
                  contractNext={item.contract?.next ?? null}
                  action={item.contract ? <ContractStage contract={item.contract} /> : null}
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
              }
              actions={(() => {
                const unread = unreadCount(item.messages.filter((message) => message.kind === "question"), item.lastReadAt);

                return (
                  <ProcessCardActions
                    cancelAccessId={item.contract?.stage === "signed" ? null : item.accessId}
                    fichaHref={`/proyectos/${item.slug}${unread > 0 ? "?tab=questions" : ""}`}
                    unread={unread}
                  />
                );
              })()}
            />
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
            {item.advisorHired ? (
              <AdvisorDesk item={item} today={today} advisors={advisors.filter((advisor) => advisor.slug === item.slug)} />
            ) : null}
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
