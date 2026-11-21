import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { CompanyFichaView, FichaLockedNote } from "@/components/company/company-ficha-view";
import { sectorKeyFromCnae } from "@/lib/sector-image";
import { bannerChips } from "@/lib/sector-theme";
import { CompanyReport } from "@/components/seller/company-report";
import { DealPipeline, ProcessRoom } from "@/components/investor/deal-pipeline";
import { LiveRefresh } from "@/components/shell/live-refresh";
import { MeetingDesk } from "@/components/investor/meeting-desk";
import { ProjectThread } from "@/components/investor/project-thread";
import { approveInvestorMeetingAction, postInvestorMessageAction, rescheduleInvestorMeetingAction } from "@/app/proyectos/[slug]/actions";
import { FavoriteButton } from "@/components/investor/favorite-button";
import { ConnectControl } from "@/components/investor/project-access-panel";
import { ShellStickyCtaBar } from "@/components/ui/sticky-cta";
import { MarketCard } from "@/components/investor/market-card";
import { companyCopy } from "@/lib/company-copy";
import type { DealStep, ProcessFile } from "@/lib/deal-pipeline";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import type { BuyerRegistry } from "@/lib/buyer-registry";
import type { ProjectAccessView } from "@/lib/project-access";
import type { ThreadMessageView } from "@/lib/project-message";
import type { BuyerPlanName } from "@/lib/billing";
import { loiAgreement, ndaAgreement } from "@/lib/deal-documents";
import { formatWholeEur } from "@/lib/money";
import type { PublicProjectCard } from "@/lib/public-project";
import { sellerCopy } from "@/lib/seller-copy";
import { companyPdfCopy } from "@/lib/company-pdf-copy";

export function InvestorProject({
  project,
  registry = null,
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
  profileComplete = true,
  initialTab = "company",
  accessId,
}: {
  project: InvestorProjectProfile;
  registry?: BuyerRegistry | null;
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
  profileComplete?: boolean;
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
      <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} align="center" />
    ) : access === "requested" ? (
      <Link
        href="/procesos"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17663a] px-4 text-sm font-medium text-white"
      >
        Firmar en Mis procesos
      </Link>
    ) : null;

  const principal = project.principalCnae?.code ?? null;
  const bannerSector = principal ? sectorKeyFromCnae(principal) : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <LiveRefresh />
      <Link href="/mercado" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#3d34b8] hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {companyCopy.backToMarket}
      </Link>

      <CompanyFichaView
        title={project.codename}
        sector={bannerSector}
        chips={bannerChips({ sector: bannerSector, region: project.region, foundedYear: project.foundedYear })}
        bannerAction={
          access === "accepted" ? (
            <a
              href={`/proyectos/${project.slug}/pdf/dossier?download=1`}
              className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-[#1c2740] hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none sm:px-4"
            >
              <Download className="size-4" aria-hidden />
              {companyPdfCopy.dossierDownload}
            </a>
          ) : (
            // Alex (S25): "Ver planes" / "Conectar" sits top-left of the banner; the favourite stays top-right.
            <div className="relative hidden lg:block">
              <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} align="start" />
            </div>
          )
        }
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
              hideQaNote
              hideWaitingCue
            />
          ) : null
        }
        favorite={<FavoriteButton slug={project.slug} favorited={favorited} />}
        afterBanner={
          <>
            {access === "none" || access === "requested" ? (
              <>
                <div className="lg:hidden" data-sticky-twin>
                  {access === "requested" ? (
                    <Link
                      href="/procesos"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17663a] px-4 text-sm font-medium text-white"
                    >
                      Firmar en Mis procesos
                    </Link>
                  ) : (
                    <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} align="center" />
                  )}
                </div>
                <ShellStickyCtaBar>
                  {access === "requested" ? (
                    <Link
                      href="/procesos"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17663a] px-4 text-sm font-medium text-white"
                    >
                      Firmar en Mis procesos
                    </Link>
                  ) : (
                    <ConnectControl slug={project.slug} status={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} align="center" />
                  )}
                </ShellStickyCtaBar>
              </>
            ) : null}
            {/* S40 (Alex): the signed LOI is no longer a separate block under the banner; it lives in Chat / Documentos. */}
          </>
        }
        initialTab={initialTab}
        tabs={{
          company: (
            <div className="grid min-w-0 gap-6">
              <div className="flex min-w-0 flex-col gap-6">
                <CompanyReport
                  project={project}
                  role="buyer"
                  buyerRegistry={registry}
                  figuresOpen={access === "accepted"}
                  lockedNote={access === "requested" ? companyCopy.figuresLockedNda : companyCopy.figuresLocked}
                  lockAction={figureAction}
                />
                <RelatedCompanies items={recommendations} />
              </div>
            </div>
          ),
          questions: access === "awaiting-seller" ? (
            <FichaLockedNote text={companyCopy.threadWaiting} />
          ) : access === "requested" ? (
            <FichaLockedNote text={companyCopy.threadSignNda} action={<ProcessLink />} />
          ) : locked ? (
            <FichaLockedNote text={companyCopy.threadLocked} action={<LockedWriteAction slug={project.slug} access={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} />} />
          ) : (
            <section className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
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
                ndaHref={accessId.length > 0 ? `/acuerdos/nda/${accessId}` : null}
                loiHref={accessId.length > 0 && signedOffer ? `/acuerdos/loi/${accessId}` : null}
                empty={sellerCopy.documentsEmpty}
              />
            </section>
          ),
          meetings: access === "awaiting-seller" ? (
            <FichaLockedNote text={companyCopy.threadWaiting} />
          ) : access === "requested" ? (
            <FichaLockedNote text={companyCopy.threadSignNda} action={<ProcessLink />} />
          ) : locked ? (
            <FichaLockedNote
              text={companyCopy.threadLocked}
              action={<LockedWriteAction slug={project.slug} access={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={project.codename} />}
            />
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

function ProcessLink() {
  return (
    <Link href="/procesos" className="inline-flex h-11 items-center rounded-xl bg-[#17663a] px-4 text-sm font-medium text-white">
      Ir a Mis procesos
    </Link>
  );
}

function LockedWriteAction({
  slug,
  access,
  plan,
  matchesLeft,
  profileComplete,
  title,
}: {
  slug: string;
  access: ProjectAccessView;
  plan: BuyerPlanName;
  matchesLeft: number | null;
  profileComplete: boolean;
  title: string;
}) {
  if (access === "awaiting-seller") {
    return <ProcessLink />;
  }

  return <ConnectControl slug={slug} status={access} plan={plan} matchesLeft={matchesLeft} profileComplete={profileComplete} title={title} />;
}

function RelatedCompanies({ items }: { items: PublicProjectCard[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recomendadas" className="mt-4 border-t border-[#d5dbe8] pt-8">
      {/* Alex (S27): no "Otras empresas" kicker and no tinted wrapper; the cards sit on the page. */}
      <h2 id="recomendadas" className="text-2xl font-semibold text-[#1c2740]">
        {companyCopy.recommendationsHeading}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <li key={item.slug}>
            <MarketCard project={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
