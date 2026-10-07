import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyBanner } from "@/components/company-banner";
import { CompanyProfile } from "@/components/company-profile-view";
import { DealPipeline, ProcessRoom } from "@/components/deal-pipeline";
import { InvestorProjectTabs } from "@/components/investor-project-tabs";
import { MeetingDesk } from "@/components/meeting-desk";
import { ProjectThread } from "@/components/project-thread";
import { approveInvestorMeetingAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
import { FavoriteButton } from "@/components/favorite-button";
import { LoiCard } from "@/components/loi-card";
import { ConnectControl } from "@/components/project-access-panel";
import { MarketCardFigures } from "@/components/market-card-figures";
import { ProjectPhoto } from "@/components/project-photo";
import { accessCopy } from "@/lib/access-copy";
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
  accessId,
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
  accessId: string;
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
  const figureAction =
    access === "none" ? (
      <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} align="center" />
    ) : access === "requested" ? (
      <Link
        href="/procesos"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17663a] px-4 text-sm font-medium text-white"
      >
        Firmar en Mis procesos
      </Link>
    ) : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href="/mercado" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#3d34b8] hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {companyCopy.backToMarket}
      </Link>

      <CompanyBanner
        title={project.codename}
        progress={
          steps.length > 0 ? (
            <DealPipeline
              steps={steps}
              role="investor"
              onDark
              sign={{
                slug: project.slug,
                nda: ndaAgreement(agreementInput),
                loi: loiAgreement({ ...agreementInput, askingPrice: formatWholeEur(project.askingPriceCents) }),
              }}
              diligence={accessId.length > 0 ? { accessId, advisorHref: "/asesoramiento" } : undefined}
            />
          ) : null
        }
      >
        <FavoriteButton slug={project.slug} favorited={favorited} />
        <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} />
      </CompanyBanner>

      {access === "accepted" && signedOffer ? (
        <LoiCard slug={project.slug} agreement={signedOffer.body} signedBody={signedOffer.body} />
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
                lockAction={figureAction}
              />
              <RelatedCompanies items={recommendations} />
            </div>
          ),
          questions: access === "requested" ? (
            <LockedNote text={accessCopy.signOnProcesses} />
          ) : locked ? (
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
            <article className="h-full overflow-hidden rounded-2xl border border-[#e7eaee] bg-white">
              <Link href={`/proyectos/${item.slug}`} className="flex h-full flex-col">
                <ProjectPhoto slug={item.slug} alt="" title={item.codename} place={item.region} />
                <span className="flex flex-1 flex-col gap-4 p-5">
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
            </article>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
