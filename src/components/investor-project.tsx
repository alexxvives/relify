import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { CompanyBanner } from "@/components/company-banner";
import { CompanyProfile } from "@/components/company-profile-view";
import { DealPipeline, ProcessRoom } from "@/components/deal-pipeline";
import { InvestorProjectTabs } from "@/components/investor-project-tabs";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { approveInvestorMeetingAction, postInvestorMessageAction, rescheduleInvestorMeetingAction, updateInvestorMeetingNotesAction } from "@/app/proyectos/[slug]/actions";
import { FavoriteButton } from "@/components/favorite-button";
import { LoiCard } from "@/components/loi-card";
import { ConnectControl, ProjectAccessPanel } from "@/components/project-access-panel";
import { MarketCardFigures } from "@/components/market-card-figures";
import { ProjectPhoto } from "@/components/project-photo";
import { companyCopy } from "@/lib/company-copy";
import type { DealStep, ProcessFile } from "@/lib/deal-pipeline";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import type { ProjectAccessView } from "@/lib/project-access";
import type { ThreadMessageView } from "@/lib/project-message";
import type { BuyerPlanName } from "@/lib/billing";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { formatWholeEur } from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";
import { sellerCopy } from "@/lib/seller-copy";

function LockedNote({ text }: { text: string }) {
  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white px-6 py-12 text-center">
      <p className="mx-auto max-w-lg text-sm leading-6 text-[#5c6b78]">{text}</p>
    </section>
  );
}

export function InvestorProject({
  project,
  recommendations,
  access,
  plan,
  favorited,
  messages,
  documents,
  steps,
  today,
  partyName,
  buyerName,
  dateLabel,
  matchesLeft,
  initialTab = "company",
}: {
  project: InvestorProjectProfile;
  recommendations: PublicProjectCard[];
  access: ProjectAccessView;
  plan: BuyerPlanName;
  favorited: boolean;
  messages: ThreadMessageView[];
  documents: ProcessFile[];
  steps: DealStep[];
  today: string;
  partyName: string;
  buyerName: string;
  dateLabel: string;
  matchesLeft: number | null;
  initialTab?: "company" | "questions" | "meetings";
}) {
  const locked = access !== "accepted";
  const chat = messages.filter((message) => message.kind === "question");
  const signedOffer = messages.find((message) => message.kind === "offer") ?? null;
  const agreementInput = {
    buyerName,
    codename: project.codename,
    region: project.region,
    dateLabel,
  };
  const connect = (
    <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} align="center" />
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href="/mercado" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#3d34b8] hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {companyCopy.backToMarket}
      </Link>

      <CompanyBanner
        title={project.codename}
        progress={steps.length > 0 ? <DealPipeline steps={steps} compact onDark /> : null}
      >
        <FavoriteButton slug={project.slug} favorited={favorited} />
        <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} />
      </CompanyBanner>

      {access === "requested" ? (
        <ProjectAccessPanel slug={project.slug} status={access} agreement={ndaAgreement(agreementInput)} />
      ) : null}
      {access === "accepted" ? (
        <LoiCard slug={project.slug} agreement={loiAgreement({ ...agreementInput, askingPrice: formatWholeEur(project.askingPriceCents) })} signedBody={signedOffer?.body ?? null} />
      ) : null}

      <InvestorProjectTabs
        initialTab={initialTab}
        panels={{
          company: (
            <div className="flex flex-col gap-6">
              <CompanyProfile
                project={project}
                figuresOpen={access === "accepted"}
                lockedNote={access === "requested" ? companyCopy.figuresLockedNda : companyCopy.figuresLocked}
                lockAction={access === "none" ? connect : null}
              />
              <RelatedCompanies items={recommendations} />
            </div>
          ),
          questions: locked ? (
            <LockedNote text={companyCopy.threadLocked} />
          ) : (
            <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">
                <ProjectThread
                  viewer="investor"
                  partyName={partyName}
                  messages={chat}
                  action={postInvestorMessageAction}
                  hidden={[
                    { name: "slug", value: project.slug },
                    { name: "kind", value: "question" },
                  ]}
                  placeholder={companyCopy.questionPrompt}
                  submitLabel={companyCopy.sendMessage}
                  pendingLabel={companyCopy.sending}
                  savedLabel={companyCopy.messageSent}
                  invalidFallback={companyCopy.messageInvalid}
                />
              </div>
              <ProcessRoom
                files={documents}
                bodies={chat.map((message) => message.body)}
                nda
                empty={sellerCopy.documentsEmpty}
              />
            </section>
          ),
          meetings: locked ? (
            <LockedNote text={companyCopy.threadLocked} />
          ) : (
            <MeetingDesk
              messages={messages}
              action={postInvestorMessageAction}
              notesAction={updateInvestorMeetingNotesAction}
              approveAction={approveInvestorMeetingAction}
              rescheduleAction={rescheduleInvestorMeetingAction}
              today={today}
              columns
              hidden={[
                { name: "slug", value: project.slug },
                { name: "kind", value: "meeting" },
              ]}
            />
          ),
        }}
      />
    </div>
  );
}

function RelatedCompanies({ items }: { items: PublicProjectCard[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recomendadas" className="mt-4 border-t border-[#d5dbe8] pt-8">
      <div className="rounded-3xl bg-[#eef1f8] px-5 py-6 sm:px-6">
      <p className="text-xs font-medium tracking-[0.18em] text-[#5c6b78] uppercase">{companyCopy.recommendationsKicker}</p>
      <h2 id="recomendadas" className="mt-2 text-2xl font-semibold text-[#1c2740]">
        {companyCopy.recommendationsHeading}
      </h2>
      <ul className="mt-4 grid grid-cols-3 gap-4">
        {items.slice(0, 3).map((item) => (
          <li key={item.slug}>
            <Link
              href={`/proyectos/${item.slug}`}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7eaee] bg-white hover:border-[#c9d0ea]"
            >
              <ProjectPhoto
                slug={item.slug}
                alt=""
                frameClassName="relative aspect-[4/3] bg-[#eef2ff]"
              />
              <span className="flex flex-1 flex-col gap-3 p-4">
                <span>
                  <span className="block text-base font-semibold text-[#1c2740]">{item.codename}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm text-[#5c6b78]">
                    <MapPin className="size-3.5" aria-hidden />
                    {item.region}
                  </span>
                </span>
                <MarketCardFigures
                  revenue={formatWholeEur(item.revenueCents)}
                  ebitda={formatWholeEur(item.ebitdaCents)}
                  adjustedEbitda={formatWholeEur(item.adjustedEbitdaCents)}
                  askingPrice={formatWholeEur(item.askingPriceCents)}
                  askingPriceCents={item.askingPriceCents}
                  ebitdaCents={item.ebitdaCents}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
