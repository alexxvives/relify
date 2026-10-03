import type { Metadata } from "next";
import { SignedInPage } from "@/components/signed-in-page";
import { WorkspaceNote } from "@/components/workspace-note";
import { investorCopy } from "@/lib/investor-copy";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: investorCopy.hiddenTitle,
  robots: { index: false, follow: false },
};

export default async function HiddenCompaniesPage() {
  await requireRole("investor");

  return (
    <SignedInPage title={investorCopy.hiddenTitle}>
      <WorkspaceNote title={investorCopy.hiddenEmpty} body={investorCopy.hiddenEmptyBody} />
    </SignedInPage>
  );
}
