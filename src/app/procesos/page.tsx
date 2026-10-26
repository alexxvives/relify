import { Suspense } from "react";
import { investorFunnel } from "@/server/activityFunnel";
import { ProcessesSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { CancelledList, InvestorProcesses } from "@/components/investor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { spanishDate } from "@/lib/deal-documents";
import { madridToday } from "@/lib/meeting";
import { investorCopy } from "@/lib/investor-copy";
import { listClientContacts } from "@/server/engagementThread";
import { listCancelledProcesses, loadInvestorDesk } from "@/server/investorDesk";
import { getCurrentUser } from "@/server/getCurrentUser";
import { requireRole } from "@/server/requireRole";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: investorCopy.processesTitle,
  robots: { index: false, follow: false },
};

async function InvestorProcessesPageContent() {
  const viewer = await getCurrentUser();
  if (viewer?.onboarded && viewer.role === "seller") {
    redirect("/mi-empresa/procesos");
  }
  const user = await requireRole("investor");
  const [desk, advisors, cancelled] = await Promise.all([
    loadInvestorDesk(user.id, user.email),
    listClientContacts(user),
    listCancelledProcesses(user.id),
  ]);
  const funnel = await investorFunnel(user.id);

  return (
    <>
      {desk.processes.length === 0 ? (
        <WorkspaceNote
          title={investorCopy.processesEmpty}
          body={investorCopy.processesEmptyBody}
          action={{ href: "/mercado", label: investorCopy.processesCta }}
        />
      ) : null}
      {desk.processes.length === 0 && cancelled.length > 0 ? (
        <div className="mt-4">
          <CancelledList items={cancelled} />
        </div>
      ) : null}
      {desk.processes.length > 0 ? (
        <InvestorProcesses items={desk.processes} buyerName={user.displayName} dateLabel={spanishDate(new Date())} today={madridToday(new Date())} advisors={advisors} cancelled={cancelled} funnel={funnel} />
      ) : null}
    </>
  );
}

export default function InvestorProcessesPage() {
  return (
    <SignedInPage title={investorCopy.processesTitle}>
      <Suspense fallback={<ProcessesSkeleton />}>
        <InvestorProcessesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
