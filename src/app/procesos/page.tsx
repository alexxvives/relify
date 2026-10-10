import type { Metadata } from "next";
import { InvestorProcesses } from "@/components/investor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { spanishDate } from "@/lib/deal-documents";
import { madridToday } from "@/lib/meeting";
import { investorCopy } from "@/lib/investor-copy";
import { loadInvestorDesk } from "@/server/investorDesk";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorProcessesPage() {
  const user = await requireRole("investor");
  const desk = await loadInvestorDesk(user.id, user.email);

  return (
    <SignedInPage title={investorCopy.processesTitle}>
      {desk.processes.length === 0 ? (
        <WorkspaceNote title={investorCopy.processesEmpty} body={investorCopy.processesEmptyBody} />
      ) : (
        <InvestorProcesses items={desk.processes} buyerName={user.displayName} dateLabel={spanishDate(new Date())} today={madridToday(new Date())} />
      )}
    </SignedInPage>
  );
}
