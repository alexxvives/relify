import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellerProcesses } from "@/components/seller-processes";
import { SignedInPage } from "@/components/signed-in-page";
import { madridToday } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
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
  const [messages, pendingMatches] = await Promise.all([
    listProjectMessages(user, null),
    listPendingMatches(user.id, projectId),
  ]);

  return (
    <SignedInPage title={sellerCopy.processesTitle}>
      <SellerProcesses threads={messages.threads} counts={messages.counts} pendingMatches={pendingMatches} today={madridToday(new Date())} />
    </SignedInPage>
  );
}
