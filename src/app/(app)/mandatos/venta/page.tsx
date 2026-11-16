import { Suspense } from "react";
import { AdvisorBoardsSkeleton } from "@/components/shell/page-skeletons";
import type { Metadata } from "next";
import { AdvisorProcesses } from "@/components/advisor/advisor-processes";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { listAdvisorProjectBoards } from "@/lib/server/advisory-engagement";
import { requireRole } from "@/lib/server/require-role";

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
