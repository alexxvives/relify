import { AdvisorCloseForm, AdvisorDepositButton, AdvisorNdaButton } from "@/components/advisor/advisor-engagement-forms";
import { AppToast } from "@/components/shell/app-toast";
import { CompanyBanner } from "@/components/seller/company-banner";
import { CompanyReport } from "@/components/seller/company-report";
import { DealPipeline } from "@/components/investor/deal-pipeline";
import { BuyerCardSlider } from "@/components/advisor/buyer-card-slider";
import { engagementCopy } from "@/lib/engagement-copy";
import type { AdvisorContactView } from "@/lib/engagement-thread";
import type { AdvisorProcessChats as AdvisorProcessChatsData } from "@/lib/server/advisor-process-chat";
import { AdvisorProcessDesk } from "@/components/advisor/advisor-process-desk";
import { FichaLockedNote } from "@/components/company/company-ficha-view";
import type { AdvisorEngagementPage } from "@/lib/server/advisory-engagement";
import { ProcessRoom } from "@/components/investor/deal-pipeline";
import type { ProcessFile } from "@/lib/deal-pipeline";
import { launchFreeCopy, launchFreeMode } from "@/lib/launch-mode";
import { sellerCopy } from "@/lib/seller-copy";

function lockNote(engagement: AdvisorEngagementPage): string {
  if (!engagement.deposit.paid) {
    return engagement.closed ? engagementCopy.figuresClosed : launchFreeMode() ? engagementCopy.figuresNeedAccept : engagementCopy.figuresNeedDeposit;
  }

  if (engagement.ndaText) {
    return engagementCopy.figuresNeedNda;
  }

  return engagementCopy.figuresNeedInvestor;
}

export function AdvisorEngagementView({
  engagement,
  thread,
  processChats = null,
  today,
  notice,
}: {
  engagement: AdvisorEngagementPage;
  thread: AdvisorContactView | null;
  processChats?: AdvisorProcessChatsData | null;
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
  const free = launchFreeMode();
  const turn = action
    ? { action: showDeposit ? (free ? launchFreeCopy.depositTurn : engagementCopy.depositTurn) : engagementCopy.ndaTurn, cta: action }
    : undefined;
  // S43 (Alex): while the encargo is not accepted each section says what the deposit opens (accepting, in the free launch).
  const lockCopy = free ? engagementCopy.acceptLock : engagementCopy.depositLock;
  const locks = engagement.deposit.paid
    ? null
    : engagement.closed
      ? {
          chat: <FichaLockedNote text={engagementCopy.figuresClosed} />,
          documents: <FichaLockedNote text={engagementCopy.figuresClosed} />,
          meetings: null,
        }
      : {
          chat: <FichaLockedNote text={lockCopy.chat} action={action ?? undefined} />,
          documents: <FichaLockedNote text={lockCopy.documents} action={action ?? undefined} />,
          meetings: <FichaLockedNote text={lockCopy.meetings} action={action ?? undefined} />,
        };
  // S43 (Alex): the same "Documentación" card as the seller's ficha: what this advisor may open (NDA-gated by the server).
  const files: ProcessFile[] =
    engagement.view === "investor"
      ? engagement.documents.map((file) => ({ id: file.id, folder: file.folder, fileName: file.fileName, stored: true, visible: true }))
      : engagement.view === "seller"
        ? engagement.folders.flatMap((folder) => folder.files.map((file) => ({ id: file.id, folder: folder.name, fileName: file.fileName, stored: true, visible: true })))
        : [];
  const documents =
    engagement.view === "public" ? (
      <FichaLockedNote text={lockNote(engagement)} action={action ?? undefined} />
    ) : (
      <ProcessRoom
        files={files}
        bodies={[]}
        nda={false}
        contractHref={engagement.contract?.signedHref ?? null}
        empty={sellerCopy.documentsEmpty}
      />
    );

  return (
    <div className="flex flex-col gap-6">
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
          {/* S40 (Alex): the buyer's process tabs; the Contrato button row is gone (the advisor neither uploads nor signs the
              contract; the signed contract stays reachable from Documentos once it exists). */}
          <AdvisorProcessDesk
            engagementId={engagement.id}
            thread={thread}
            processChats={processChats}
            today={today}
            overlay={hasBuyers ? <BuyerCardSlider buyers={engagement.buyers} /> : null}
            hiredBy={engagement.hiredByInvestor ? "investor" : "seller"}
            locks={locks}
            company={
              <>
              {engagement.profile ? (
                <CompanyReport
                  project={engagement.profile}
                  role="buyer"
                  figuresOpen={engagement.figuresOpen}
                  lockedNote={lockNote(engagement)}
                  lockAction={action}
                />
              ) : null}
              </>
            }
            documents={documents}
          />
          {engagement.deposit.paid ? (
            <AdvisorCloseForm engagementId={engagement.id} closed={engagement.closed} feeLabel={engagement.feeLabel} agreedFee={engagement.agreedFee} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
