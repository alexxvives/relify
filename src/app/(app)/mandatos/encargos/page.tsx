import { Suspense } from "react";
import { AdvisorBoardsSkeleton } from "@/components/page-skeletons";
import type { Metadata } from "next";
import { AdvisorProcesses } from "@/components/advisor-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { advisorCopy } from "@/lib/advisor-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { listAdvisorProjectBoards } from "@/server/advisoryEngagement";
import { fulfillCheckout } from "@/server/fulfillCheckout";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: advisorCopy.encargosTitle,
  robots: { index: false, follow: false },
};

async function AdvisorEngagementsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireRole("advisor");
  const query = await searchParams;

  if (typeof query.session_id === "string" && query.session_id !== "") {
    await fulfillCheckout(query.session_id, user.id);
  }

  const boards = await listAdvisorProjectBoards(user.id, "awaiting");

  return (
    <>
      <AdvisorProcesses boards={boards} empty={engagementCopy.mineEmpty} />
    </>
  );
}

export default function AdvisorEngagementsPage(props: Parameters<typeof AdvisorEngagementsPageContent>[0]) {
  return (
    <SignedInPage title={advisorCopy.encargosTitle}>
      <Suspense fallback={<AdvisorBoardsSkeleton />}>
        <AdvisorEngagementsPageContent {...props} />
      </Suspense>
    </SignedInPage>
  );
}
