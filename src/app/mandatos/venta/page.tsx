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

export default async function AdvisorMandatesPage() {
  const user = await requireRole("advisor");
  const boards = await listAdvisorProjectBoards(user.id);

  return (
    <SignedInPage title={advisorCopy.mandatesTitle}>
      <AdvisorProcesses boards={boards} />
    </SignedInPage>
  );
}
