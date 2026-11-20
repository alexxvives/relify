import { AdvisorCloseForm, AdvisorDepositButton, AdvisorNdaButton } from "@/components/advisor/advisor-engagement-forms";
import { AdvisorContactDesk } from "@/components/advisor/advisor-contact-desk";
import { AppToast } from "@/components/shell/app-toast";
import { CompanyBanner } from "@/components/seller/company-banner";
import { CompanyReport } from "@/components/seller/company-report";
import { ContractStage } from "@/components/investor/contract-stage";
import { DealPipeline } from "@/components/investor/deal-pipeline";
import { BuyerCardSlider } from "@/components/advisor/buyer-card-slider";
import { AdvisorBuyerOverlay } from "@/components/advisor/advisor-rail-dock";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { AdvisorEngagementPage } from "@/lib/server/advisory-engagement";
import { Card } from "@/components/ui/form";

function lockNote(engagement: AdvisorEngagementPage): string {
  if (!engagement.deposit.paid) {
    return engagement.closed ? engagementCopy.figuresClosed : engagementCopy.figuresNeedDeposit;
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
  const showDeposit = !engagement.deposit.paid && !engagement.closed;
  const hasBuyers = engagement.buyers.length > 0;
  // S36 (Alex): the pending action is a popup, from Tu turno in the banner and from every locked section.
  const action = showDeposit ? (
    <AdvisorDepositButton
      engagementId={engagement.id}
      amountLabel={engagement.deposit.amountLabel}
      priceLabel={engagement.deposit.priceLabel}
    />
  ) : engagement.ndaText ? (
    <AdvisorNdaButton engagementId={engagement.id} text={engagement.ndaText} />
  ) : null;
  const turn = action
    ? { action: showDeposit ? engagementCopy.depositTurn : engagementCopy.ndaTurn, cta: action }
    : undefined;

  return (
    <div className={`flex flex-col gap-6 ${hasBuyers ? "max-lg:pb-24" : ""}`}>
      <AppToast message={notice} tone={notice === engagementCopy.depositPaidNote ? "ok" : "error"} />
      <div>
        <div className="flex min-w-0 flex-col gap-6">
          <CompanyBanner
            title={engagement.codename}
            subtitle={engagement.region}
            progress={
              engagement.steps.length > 0 ? (
                <DealPipeline steps={engagement.steps} role="advisor" onDark hideWaitingCue turn={turn} />
              ) : null
            }
          />
          {/* S36 (Alex): no client/services helper line; Contrato stays while the encargo is open. */}
          {engagement.contract && !engagement.closed ? (
            <div className="flex flex-wrap items-center gap-3">
              <ContractStage contract={engagement.contract} />
            </div>
          ) : null}
          {engagement.profile ? (
            <CompanyReport
              project={engagement.profile}
              role="buyer"
              figuresOpen={engagement.figuresOpen}
              lockedNote={lockNote(engagement)}
              lockAction={action}
            />
          ) : null}
          {engagement.view === "investor" ? (
            <Card>
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
            </Card>
          ) : null}
          {engagement.view === "seller" ? (
            <Card>
              <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.foldersTitle}</h2>
              {engagement.folders.length === 0 ? (
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
            </Card>
          ) : null}
          {thread ? <AdvisorContactDesk contacts={[thread]} today={today} showDocuments={false} pinned /> : null}
          {engagement.deposit.paid ? (
            <AdvisorCloseForm engagementId={engagement.id} closed={engagement.closed} feeLabel={engagement.feeLabel} />
          ) : null}
        </div>
        {hasBuyers ? <AdvisorBuyerOverlay folded={action !== null}>{<BuyerCardSlider buyers={engagement.buyers} />}</AdvisorBuyerOverlay> : null}
      </div>
    </div>
  );
}
