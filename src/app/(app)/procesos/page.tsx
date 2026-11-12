import { Suspense } from "react";
import { ProcessesSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { CancelledList, InvestorProcesses } from "@/components/investor/investor-processes";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { ProcessesPlaceholder } from "@/components/shell/processes-placeholder";
import { spanishDate } from "@/lib/deal-documents";
import { madridToday } from "@/lib/meeting";
import { investorCopy } from "@/lib/investor-copy";
import { listClientContacts } from "@/lib/server/engagement-thread";
import { listCancelledProcesses, loadInvestorDesk } from "@/lib/server/investor-desk";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { requireRole } from "@/lib/server/require-role";
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

  return (
    <>
      {desk.processes.length === 0 ? (
        <ProcessesPlaceholder cta={investorCopy.processesCta} />
      ) : null}
      {desk.processes.length === 0 && cancelled.length > 0 ? (
        <div className="mt-4">
          <CancelledList items={cancelled} />
        </div>
      ) : null}
      {desk.processes.length > 0 ? (
        <InvestorProcesses items={desk.processes} buyerName={user.displayName} dateLabel={spanishDate(new Date())} today={madridToday(new Date())} advisors={advisors} cancelled={cancelled} />
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
