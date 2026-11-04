import { Suspense } from "react";
import { SellerProcessesSkeleton } from "@/components/page-skeletons";
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
  // Independent lookups: run together rather than as a waterfall (every query is a Neon round trip).
  const [nifVerified, projectId] = await Promise.all([companyNifIsVerified(user), activeSellerProjectId(user.id)]);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const [messages, pendingMatches, advisors, scope] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    listClientContacts(user),
    sellerProcessScope(user.id),
  ]);

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
      <Suspense fallback={<SellerProcessesSkeleton />}>
        <ProcessesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
