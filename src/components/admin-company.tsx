import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminSabiPanel } from "@/components/admin-sabi-panel";
import { CompanyProfile } from "@/components/company-profile-view";
import { DealPipeline, DealWaitingCue } from "@/components/deal-pipeline";
import { InvestorProjectTabs } from "@/components/investor-project-tabs";
import { InvestorPublicCard } from "@/components/investor-public-card";
import { adminCopy } from "@/lib/admin-copy";
import { companyCopy } from "@/lib/company-copy";
import { watchingCue } from "@/lib/deal-pipeline";
import { meetingIsPast, readMeeting } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import type { AdminCompanyMessage, AdminCompanyView, AdminSideAdvisor } from "@/server/getAdminCompany";

const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-");
  const name = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${name} ${year}`;
}

function statusLabel(status: AdminCompanyView["status"]): string {
  if (status === "published") {
    return adminCopy.statusPublished;
  }

  if (status === "pending") {
    return adminCopy.statusPending;
  }

  return adminCopy.statusDraft;
}

export function AdminCompany({
  view,
  backHref,
  backLabel,
  today,
}: {
  view: AdminCompanyView;
  backHref: string;
  backLabel: string;
  today: string;
}) {
  const selected = view.accesses.find((access) => access.id === view.selectedId) ?? null;
  const messages = selected?.messages ?? [];
  const chat = messages.filter((message) => message.kind !== "meeting");
  const meetings = messages.filter((message) => message.kind === "meeting");

  const company = (
    <>
      <AdminSabiPanel
        sabi={view.sabi}
        banner={{
          title: view.profile.codename,
          subtitle: view.profile.region,
          status: { label: statusLabel(view.status), live: view.status === "published" },
          cue: selected ? <DealWaitingCue cue={{ action: watchingCue(selected.steps) }} onDark /> : null,
          progress:
            selected && selected.steps.length > 0 ? (
              <DealPipeline steps={selected.steps} role="advisor" onDark hideAsideCue hideWaitingCue />
            ) : null,
        }}
      />
      {selected && !view.investor ? (
        <p className="text-sm text-[#3d4a63]">
          {adminCopy.investorParty} · {selected.investorLabel}
        </p>
      ) : null}
      <InvestorProjectTabs
        panels={{
          company: <CompanyProfile project={view.profile} figuresOpen privateFacts={view.privateFacts} privateHeading={adminCopy.privateHeading} />,
          questions: selected ? <ChatPanel messages={chat} /> : <EmptyPanel text={adminCopy.processNone} />,
          meetings: selected ? <MeetingPanel messages={meetings} today={today} /> : <EmptyPanel text={adminCopy.processNone} />,
        }}
      />
    </>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#3d34b8] hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      {view.investor ? (
        <div className="xl:grid xl:items-start xl:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">{company}</div>
          <aside className="mt-6 flex flex-col gap-4 xl:sticky xl:top-6 xl:mt-0 xl:self-start">
            <InvestorPublicCard label={view.investor.label} profile={view.investor.profile} />
            {view.advisors.map((advisor) => (
              <AdvisorSideCard key={advisor.id} advisor={advisor} />
            ))}
          </aside>
        </div>
      ) : (
        <div className="flex flex-col gap-6">{company}</div>
      )}
    </div>
  );
}

function AdvisorSideCard({ advisor }: { advisor: AdminSideAdvisor }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[#e7eaee] bg-white text-[#1c2740] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.35)]">
      <div className="bg-[#1c2740] px-6 py-4">
        <p className="text-xs font-semibold text-white/70">Asesor</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{advisor.label}</h2>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-[#5c6b78]">{advisor.hiredBy}</p>
        {advisor.services.length > 0 ? <p className="mt-3 text-sm font-medium text-[#1c2740]">{advisor.services}</p> : null}
        {advisor.sectors.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {advisor.sectors.map((sector) => (
              <li key={sector} className="rounded-full bg-[#f4f7ff] px-3 py-1 text-xs text-[#1c2740]">
                {sector}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-12 text-center">
      <p className="text-sm text-[#667085]">{text}</p>
    </section>
  );
}

function ChatPanel({ messages }: { messages: AdminCompanyMessage[] }) {
  if (messages.length === 0) {
    return <EmptyPanel text={adminCopy.chatEmpty} />;
  }

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <ol className="flex flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id} className="max-w-3xl rounded-2xl border border-[#e6e9f0] bg-[#f4f7ff] px-4 py-3">
            <p className="text-xs font-medium text-[#3d34b8]">
              {message.authorLabel}
              <span className="ml-2 font-normal text-[#667085]">
                {message.kind === "offer" ? "Oferta indicativa" : "Pregunta"} · {message.createdAt}
              </span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1c2740]">{message.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MeetingPanel({ messages, today }: { messages: AdminCompanyMessage[]; today: string }) {
  if (messages.length === 0) {
    return <EmptyPanel text={companyCopy.meetingsEmpty} />;
  }

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <ul className="flex flex-col gap-2">
        {messages.map((message) => {
          const slot = readMeeting(message.body);
          const past = slot ? meetingIsPast(slot, today) : false;
          const tag = !slot ? null : past ? sellerCopy.meetingsDoneTag : slot.status === "proposed" ? sellerCopy.meetingsProposalTag : sellerCopy.meetingsScheduledTag;

          return (
            <li key={message.id} className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
              {slot ? (
                <p className="text-sm font-semibold text-[#1c2740]">
                  {slot.from === slot.to ? formatDay(slot.from) : `${formatDay(slot.from)} – ${formatDay(slot.to)}`}
                  <span className="ml-2 font-medium text-[#465ab4]">
                    {slot.fromTime}–{slot.toTime}
                  </span>
                  {tag ? (
                    <span className="ml-2 rounded-full bg-[#eef2ff] px-2 py-0.5 align-middle text-xs font-semibold text-[#465ab4]">
                      {tag}
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="text-sm text-[#1c2740]">{message.authorLabel}</p>
              )}
              <p className="mt-1 text-xs text-[#667085]">
                {message.authorLabel} · {message.createdAt}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
