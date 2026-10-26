import { Suspense } from "react";
import { ProcessesSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller-processes";
import { SellerSaleCompleted } from "@/components/sale-completed";
import { sellerSaleSummary } from "@/server/saleOutcome";
import { SignedInPage } from "@/components/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import { listClientContacts } from "@/server/engagementThread";
import { listPendingMatches } from "@/server/listPendingMatches";
import { listProjectMessages } from "@/server/listProjectMessages";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId, sellerProcessScope } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.processesTitle,
  robots: { index: false, follow: false },
};

async function ProcessesPageContent() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const projectId = await activeSellerProjectId(user.id);
  const [messages, pendingMatches, advisors, scope] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    listClientContacts(user),
    sellerProcessScope(user.id),
  ]);

  const sale = await sellerSaleSummary(user.id, projectId);
  if (sale) {
    return <SellerSaleCompleted codename={sale.codename} figures={sale} docs={sale} />;
  }

  return (
    <>
      <SellerProcesses
        threads={messages.threads}
        counts={messages.counts}
        pendingMatches={pendingMatches}
        today={madridToday(new Date())}
        advisors={advisors}
        companyName={scope.codename}
        elsewhere={scope.elsewhere}
      />
    </>
  );
}

export default function ProcessesPage() {
  return (
    <SignedInPage title={sellerCopy.processesTitle}>
      <Suspense fallback={<ProcessesSkeleton />}>
        <ProcessesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
