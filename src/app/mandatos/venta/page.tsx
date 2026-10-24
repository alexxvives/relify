import { Suspense } from "react";
import { AdvisorBoardsSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { AdvisorProcesses } from "@/components/advisor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { listAdvisorProjectBoards } from "@/server/advisoryEngagement";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.mandatesTitle,
  robots: { index: false, follow: false },
};

async function AdvisorMandatesPageContent() {
  const user = await requireRole("advisor");
  const boards = await listAdvisorProjectBoards(user.id, "active");

  return (
    <>
      <AdvisorProcesses boards={boards} />
    </>
  );
}

export default function AdvisorMandatesPage() {
  return (
    <SignedInPage title={advisorCopy.mandatesTitle}>
      <Suspense fallback={<AdvisorBoardsSkeleton />}>
        <AdvisorMandatesPageContent />
      </Suspense>
    </SignedInPage>
  );
}
