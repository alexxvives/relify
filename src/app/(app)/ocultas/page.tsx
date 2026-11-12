import type { Metadata } from "next";
import { SignedInPage } from "@/components/shell/signed-in-page";
import { WorkspaceNote } from "@/components/shell/workspace-note";
import { investorCopy } from "@/lib/investor-copy";
import { requireRole } from "@/lib/server/require-role";

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
