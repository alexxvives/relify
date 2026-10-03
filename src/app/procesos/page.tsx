import type { Metadata } from "next";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { investorCopy } from "@/lib/investor-copy";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function InvestorProcessesPage() {
  await requireRole("investor");

  return (
    <SignedInPage title={investorCopy.processesTitle}>
      <WorkspaceNote title={investorCopy.processesEmpty} body={investorCopy.processesEmptyBody} />
    </SignedInPage>
  );
}
