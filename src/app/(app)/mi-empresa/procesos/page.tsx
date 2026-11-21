import { Suspense } from "react";
import { SellerProcessesSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller/seller-processes";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { sellerCopy } from "@/lib/seller-copy";
import { listPendingMatches } from "@/lib/server/list-pending-matches";
import { listProjectMessages } from "@/lib/server/list-project-messages";
import { requireRole } from "@/lib/server/require-role";
import { activeSellerProjectId, sellerProcessScope } from "@/lib/server/seller-company";
import { companyNifIsVerified } from "@/lib/server/verify-company-nif";

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

  const [messages, pendingMatches, scope] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    sellerProcessScope(user.id),
  ]);

  return (
    <>
      <SellerProcesses
        threads={messages.threads}
        counts={messages.counts}
        pendingMatches={pendingMatches}
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
