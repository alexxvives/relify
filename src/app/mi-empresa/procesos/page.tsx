import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdvisorAccessPanel } from "@/components/advisor-access-panel";
import { SellerProcesses } from "@/components/seller-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import { sellerAdvisorAccess } from "@/server/advisoryEngagement";
import { listPendingMatches } from "@/server/listPendingMatches";
import { listProjectMessages } from "@/server/listProjectMessages";
import { requireRole } from "@/server/requireRole";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { companyNifIsVerified } from "@/server/verifyCompanyNif";

export const metadata: Metadata = {
  title: sellerCopy.processesTitle,
  robots: { index: false, follow: false },
};

export default async function ProcessesPage() {
  const user = await requireRole("seller");
  const nifVerified = await companyNifIsVerified(user);

  if (!nifVerified) {
    redirect("/mi-empresa");
  }

  const projectId = await activeSellerProjectId(user.id);
  const [messages, pendingMatches, access] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
    sellerAdvisorAccess(user.id, projectId),
  ]);

  return (
    <SignedInPage title={sellerCopy.processesTitle}>
      <AdvisorAccessPanel access={access} folders={[]} mode="process" />
      <SellerProcesses threads={messages.threads} counts={messages.counts} pendingMatches={pendingMatches} today={madridToday(new Date())} />
    </SignedInPage>
  );
}
