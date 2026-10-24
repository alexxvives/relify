import type { Metadata } from "next";
import { InvestorProcesses } from "@/components/investor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { spanishDate } from "@/lib/deal-documents";
import { madridToday } from "@/lib/meeting";
import { investorCopy } from "@/lib/investor-copy";
import { listClientContacts } from "@/server/engagementThread";
import { loadInvestorDesk } from "@/server/investorDesk";
import { listCancelledProcesses } from "@/server/listCancelledProcesses";
import { CancelledProcesses } from "@/components/cancelled-processes";
import { getCurrentUser } from "@/server/getCurrentUser";
import { requireRole } from "@/server/requireRole";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: investorCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorProcessesPage() {
  const viewer = await getCurrentUser();
  if (viewer?.onboarded && viewer.role === "seller") {
    redirect("/mi-empresa/procesos");
  }
  const user = await requireRole("investor");
  const [desk, advisors, cancelled] = await Promise.all([
    loadInvestorDesk(user.id, user.email),
    listClientContacts(user),
    listCancelledProcesses(user),
  ]);

  return (
    <SignedInPage title={investorCopy.processesTitle}>
      {desk.processes.length === 0 ? (
        <WorkspaceNote
          title={investorCopy.processesEmpty}
          body={investorCopy.processesEmptyBody}
          action={{ href: "/mercado", label: investorCopy.processesCta }}
        />
      ) : (
        <InvestorProcesses items={desk.processes} buyerName={user.displayName} dateLabel={spanishDate(new Date())} today={madridToday(new Date())} advisors={advisors} />
      )}
      <CancelledProcesses items={cancelled} viewer="investor" />
    </SignedInPage>
  );
}
