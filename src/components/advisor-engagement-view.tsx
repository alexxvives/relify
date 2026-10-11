import { AdvisorCloseForm, AdvisorDepositForm, AdvisorNdaForm } from "@/components/advisor-engagement-forms";
import { AdvisorContactDesk } from "@/components/advisor-contact-desk";
import { AppToast } from "@/components/app-toast";
import { CompanyBanner } from "@/components/company-banner";
import { CompanyProfile } from "@/components/company-profile-view";
import { DealPipeline } from "@/components/deal-pipeline";
import { FloatingInvestorCard } from "@/components/floating-investor-card";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { AdvisorEngagementPage } from "@/server/advisoryEngagement";

function lockNote(engagement: AdvisorEngagementPage): string {
  if (!engagement.deposit.paid) {
    return engagementCopy.figuresNeedDeposit;
  }

  if (engagement.ndaText) {
    return engagementCopy.figuresNeedNda;
  }

  return engagementCopy.figuresNeedInvestor;
}

export function AdvisorEngagementView({
  engagement,
  thread,
  today,
  notice,
}: {
  engagement: AdvisorEngagementPage;
  thread: AdvisorContactView | null;
  today: string;
  notice: string | null;
}) {
  const rail = engagement.hiredByInvestor || !engagement.deposit.paid;

  return (
    <div className={`flex flex-col gap-6 ${engagement.deposit.paid ? "" : "max-xl:pb-44"}`}>
      <AppToast message={notice} tone={notice === engagementCopy.depositPaidNote ? "ok" : "error"} />
      <div className={rail ? "xl:grid xl:items-start xl:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}>
        <div className="flex min-w-0 flex-col gap-6">
          <CompanyBanner
            title={engagement.codename}
            subtitle={engagement.region}
            progress={
              engagement.steps.length > 0 ? (
                <DealPipeline steps={engagement.steps} role="advisor" onDark hideWaitingCue />
              ) : null
            }
          />
          <p className="text-sm text-[#64748b]">
            {engagement.clientLabel}
            {engagement.services.length > 0 ? ` · ${engagement.services}` : ""}
          </p>
          {engagement.profile ? (
            <CompanyProfile project={engagement.profile} figuresOpen={engagement.figuresOpen} lockedNote={lockNote(engagement)} />
          ) : null}
          {engagement.view === "investor" ? (
            <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
              <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.documentsTitle}</h2>
              {engagement.documents.length === 0 ? (
                <p className="mt-3 text-sm text-[#64748b]">{engagementCopy.documentsEmpty}</p>
              ) : (
                <ul className="mt-4 grid gap-2">
                  {engagement.documents.map((file) => (
                    <li key={file.id}>
                      <a className="text-sm font-medium text-[#465ab4]" href={`/mi-empresa/documentos/archivo/${file.id}`}>
                        {file.folder} · {file.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          {engagement.view === "seller" ? (
            <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
              <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.foldersTitle}</h2>
              <p className="mt-1 text-sm text-[#64748b]">{engagementCopy.processNote}</p>
              {engagement.folders.length === 0 && !engagement.processOpened ? (
                <p className="mt-3 text-sm text-[#64748b]">{engagementCopy.sellerWait}</p>
              ) : null}
              <ul className="mt-4 grid gap-3">
                {engagement.folders.map((folder) => (
                  <li key={folder.name} className="rounded-2xl bg-[#f7f8fb] p-4">
                    <h3 className="text-base font-semibold">{folder.name}</h3>
                    {folder.files.length === 0 ? <p className="mt-2 text-sm text-[#64748b]">Sin archivos</p> : null}
                    <ul className="mt-2 grid gap-1">
                      {folder.files.map((file) => (
                        <li key={file.id}>
                          <a className="text-sm text-[#465ab4]" href={`/mi-empresa/documentos/archivo/${file.id}`}>
                            {file.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-lg font-semibold">{engagementCopy.processTitle}</h3>
              {engagement.processOpened ? (
                <ol className="mt-3 grid gap-2">
                  {engagementCopy.steps.map((step) => (
                    <li key={step} className="rounded-xl bg-[#f7f8fb] px-3 py-2 text-sm">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-[#64748b]">{engagementCopy.processClosed}</p>
              )}
            </section>
          ) : null}
          {thread ? <AdvisorContactDesk contacts={[thread]} today={today} showDocuments={false} /> : null}
          {engagement.ndaText ? <AdvisorNdaForm engagementId={engagement.id} text={engagement.ndaText} /> : null}
          {engagement.deposit.paid ? (
            <AdvisorCloseForm engagementId={engagement.id} closed={engagement.closed} feeLabel={engagement.feeLabel} />
          ) : null}
        </div>
        {rail ? (
          <aside className="xl:sticky xl:top-6 xl:flex xl:h-[calc(100dvh-3rem)] xl:flex-col">
            {engagement.hiredByInvestor ? (
              <div className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-y-auto">
                <div className="w-full xl:my-auto">
                  <FloatingInvestorCard name={engagement.clientLabel} profile={engagement.investorCard} />
                </div>
              </div>
            ) : (
              <div className="hidden xl:block xl:min-h-0 xl:flex-1" />
            )}
            {engagement.deposit.paid ? null : (
              <div className="max-xl:fixed max-xl:right-4 max-xl:bottom-4 max-xl:z-30 max-xl:w-[min(22rem,calc(100vw-2rem))] xl:w-full xl:shrink-0 xl:pt-4">
                <AdvisorDepositForm engagementId={engagement.id} amountLabel={engagement.deposit.amountLabel} />
              </div>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
