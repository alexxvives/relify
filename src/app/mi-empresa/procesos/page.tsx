import { Suspense } from "react";
import { sellerFunnel } from "@/server/activityFunnel";
import { ProcessesSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller-processes";
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
  const [messages, pendingMatches, advisors, scope, funnel] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    listClientContacts(user),
    sellerProcessScope(user.id),
    sellerFunnel(user.id, projectId),
  ]);

  return (
    <>
      <SellerProcesses
        funnel={funnel}
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
